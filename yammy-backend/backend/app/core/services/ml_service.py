import asyncio
import io
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi import UploadFile
from PIL import Image
import torch
from mtcnn import MTCNN
from mtcnn.utils.images import load_image
from sentence_transformers import SentenceTransformer, util
from transformers import CLIPModel, CLIPProcessor

from app.infrastructure.config.config import BASE_DIR
from app.utils.constants.moderation_constants import (
    IMAGE_MODERATION_CATEGORIES,
    TEXT_MODERATION_PATTERNS,
    TEXT_SIMILARITY_MAX,
    TEXT_SIMILARITY_MIN,
)
from app.infrastructure.logging.logger import get_logger
from app.utils.helpers.singleton_meta import SingletonMeta

logger = get_logger(__name__)


class MLService(metaclass=SingletonMeta):
    _ST_HUB_REPO = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    _ST_REMOTE_ID = "paraphrase-multilingual-MiniLM-L12-v2"
    _CLIP_REPO_ID = "openai/clip-vit-base-patch32"
    _LOCAL_KWARGS: dict[str, bool] = {"local_files_only": True}

    def __init__(self) -> None:
        self.embeddings_model = self._load_sentence_transformer()
        self.face_detection_model = MTCNN(device="CPU:0")
        self.clip_model, self.clip_processor = self._load_clip()
        self._executor = ThreadPoolExecutor(max_workers=4)

        self._cached_pattern_embeddings = self._precompute_pattern_embeddings()

    @classmethod
    def _hub_roots(cls) -> list[Path]:
        return [
            (BASE_DIR.parent / "hf_model_cache").resolve() / "hub",
            Path.home() / ".cache" / "huggingface" / "hub",
        ]

    @classmethod
    def _snapshot_dir(cls, repo_id: str) -> Path | None:
        folder = "models--" + repo_id.replace("/", "--")
        for hub in cls._hub_roots():
            if not hub.is_dir():
                continue
            snaps = hub / folder / "snapshots"
            if not snaps.is_dir():
                continue
            candidates = [
                p for p in snaps.iterdir() if p.is_dir() and (p / "config.json").is_file()
            ]
            if not candidates:
                continue
            candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
            return candidates[0]
        return None

    @classmethod
    def _load_sentence_transformer(cls) -> SentenceTransformer:
        snap = cls._snapshot_dir(cls._ST_HUB_REPO)
        if snap is not None:
            try:
                return SentenceTransformer(
                    str(snap),
                    model_kwargs=cls._LOCAL_KWARGS,
                    tokenizer_kwargs=cls._LOCAL_KWARGS,
                    config_kwargs=cls._LOCAL_KWARGS,
                )
            except TypeError:
                return SentenceTransformer(str(snap), model_kwargs=cls._LOCAL_KWARGS)
            except Exception as exc:
                logger.warning(
                    "ml_sentence_transformer_local_failed",
                    path=str(snap),
                    error=str(exc),
                    message="falling back to hub",
                )
        return SentenceTransformer(cls._ST_REMOTE_ID)

    @classmethod
    def _load_clip(cls) -> tuple[CLIPModel, CLIPProcessor]:
        snap = cls._snapshot_dir(cls._CLIP_REPO_ID)
        if snap is not None:
            try:
                return (
                    CLIPModel.from_pretrained(str(snap), local_files_only=True),
                    CLIPProcessor.from_pretrained(str(snap), local_files_only=True),
                )
            except Exception as exc:
                logger.warning(
                    "ml_clip_local_failed",
                    path=str(snap),
                    error=str(exc),
                    message="falling back to hub",
                )
        return (
            CLIPModel.from_pretrained(cls._CLIP_REPO_ID, local_files_only=False),
            CLIPProcessor.from_pretrained(cls._CLIP_REPO_ID, local_files_only=False),
        )

    def _precompute_pattern_embeddings(self) -> dict[str, torch.Tensor]:
        cached = {}
        for category, patterns in TEXT_MODERATION_PATTERNS.items():
            embeddings = self.embeddings_model.encode(patterns, convert_to_tensor=True)
            cached[category] = embeddings
        return cached

    def _encode_sync(self, text: str):
        embedding = self.embeddings_model.encode(text)
        return embedding.tolist()

    def _detect_faces_sync(self, image_bytes: bytes):
        image = load_image(image_bytes)
        result = self.face_detection_model.detect_faces(image)
        return result

    def _moderate_content_sync(self, image_bytes: bytes) -> dict[str, float]:
        image = Image.open(io.BytesIO(image_bytes))

        result = {}

        with torch.no_grad():
            for category, labels in IMAGE_MODERATION_CATEGORIES.items():
                inputs = self.clip_processor(
                    text=labels,
                    images=image,
                    return_tensors="pt",
                    padding=True,
                )

                outputs = self.clip_model(**inputs)
                logits_per_image = outputs.logits_per_image[0]
                probs = logits_per_image.softmax(dim=0)

                result[category] = float(probs[1])

        return result

    def _moderate_text_sync(self, normalized_text: str) -> dict[str, float]:
        if len(normalized_text) < 3:
            return {category: 0.0 for category in TEXT_MODERATION_PATTERNS.keys()}

        text_embedding = self.embeddings_model.encode(normalized_text, convert_to_tensor=True)

        result = {}

        for category, pattern_embeddings in self._cached_pattern_embeddings.items():
            similarities = util.cos_sim(text_embedding, pattern_embeddings)[0]

            max_similarity = float(similarities.max())

            normalized = max(
                0.0,
                min(
                    1.0,
                    (max_similarity - TEXT_SIMILARITY_MIN) / (TEXT_SIMILARITY_MAX - TEXT_SIMILARITY_MIN),
                ),
            )

            result[category] = normalized

        return result

    async def detect_faces(self, image: UploadFile):
        image_bytes = await image.read()

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self._executor,
            self._detect_faces_sync,
            image_bytes,
        )

    async def moderate_content(self, image: UploadFile, threshold: float = 0.3) -> tuple[bool, dict[str, float]]:
        image_bytes = await image.read()

        loop = asyncio.get_event_loop()
        probabilities = await loop.run_in_executor(
            self._executor,
            self._moderate_content_sync,
            image_bytes,
        )

        unsafe_categories = ["nsfw", "weapons", "drugs", "violence", "hate"]
        is_safe = all(probabilities[cat] < threshold for cat in unsafe_categories)

        return is_safe, probabilities

    async def moderate_text(self, text: str, threshold: float = 0.3) -> tuple[bool, dict[str, float]]:
        loop = asyncio.get_event_loop()
        probabilities = await loop.run_in_executor(
            self._executor,
            self._moderate_text_sync,
            text,
        )

        logger.warning("Text probabilities", probabilities=probabilities)
        unsafe_categories = ["scam", "crypto", "drugs", "escort", "spam"]
        is_safe = all(probabilities[cat] < threshold for cat in unsafe_categories)

        return is_safe, probabilities

    async def get_embedding(self, text: str):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self._executor,
            self._encode_sync,
            text,
        )
