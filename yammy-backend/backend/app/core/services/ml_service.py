import asyncio
import io
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from fastapi import UploadFile
import numpy as np
from PIL import Image
import torch
from mtcnn import MTCNN
from sentence_transformers import SentenceTransformer, util
from transformers import CLIPModel, CLIPProcessor

from app.infrastructure.config.config import BASE_DIR
from app.utils.constants.moderation_constants import (
    IMAGE_CLIP_LOGIT_SCALE,
    IMAGE_CLIP_PAIR_LOGIT_MARGIN_NON_NSFW,
    IMAGE_CLIP_PAIR_LOGIT_MARGIN_NSFW,
    IMAGE_MODERATION_CLIP_THRESHOLD,
    IMAGE_MODERATION_CLIP_THRESHOLD_NSFW,
    IMAGE_MODERATION_FLAGS,
    IMAGE_MODERATION_SAFE_ANCHOR,
    TEXT_MODERATION_DEFAULT_THRESHOLD,
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
        self._clip_moderation_flag_categories, self._clip_moderation_text_feats = (
            self._precompute_clip_moderation_text_embeddings()
        )

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

    def _precompute_clip_moderation_text_embeddings(
        self,
    ) -> tuple[list[str], torch.Tensor]:
        texts = [prompt for _, prompt in IMAGE_MODERATION_FLAGS] + [IMAGE_MODERATION_SAFE_ANCHOR]
        categories = [cat for cat, _ in IMAGE_MODERATION_FLAGS]
        device = next(self.clip_model.parameters()).device
        inputs = self.clip_processor(
            text=texts,
            return_tensors="pt",
            padding=True,
            truncation=True,
        )
        tensor_inputs = {
            k: v.to(device) for k, v in inputs.items() if torch.is_tensor(v)
        }
        with torch.no_grad():
            text_out = self.clip_model.get_text_features(**tensor_inputs)
            feats = text_out.pooler_output
            feats = feats / feats.norm(dim=-1, keepdim=True)
        return categories, feats

    def _encode_sync(self, text: str):
        embedding = self.embeddings_model.encode(text)
        return embedding.tolist()

    def _decode_image_rgb_uint8(self, image_bytes: bytes) -> np.ndarray:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return np.asarray(image, dtype=np.uint8)

    def _detect_faces_sync(self, image_bytes: bytes):
        image = self._decode_image_rgb_uint8(image_bytes)
        result = self.face_detection_model.detect_faces(image)
        return result

    def _moderate_content_sync(self, image_bytes: bytes) -> dict[str, float]:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        device = next(self.clip_model.parameters()).device
        img_inputs = self.clip_processor(images=image, return_tensors="pt")
        pixel_values = img_inputs["pixel_values"].to(device)

        text_all = self._clip_moderation_text_feats
        categories = self._clip_moderation_flag_categories

        with torch.no_grad():
            image_out = self.clip_model.get_image_features(pixel_values=pixel_values)
            image_feat = image_out.pooler_output
            image_feat = image_feat / image_feat.norm(dim=-1, keepdim=True)

            unsafe_feats = text_all[:-1]
            safe_vec = text_all[-1:]
            scale = float(IMAGE_CLIP_LOGIT_SCALE)

            logits_u = scale * (image_feat * unsafe_feats).sum(dim=-1)
            logits_s = scale * (image_feat * safe_vec).sum(dim=-1).expand_as(logits_u)
            logits = torch.stack([logits_u, logits_s], dim=-1)
            probs = logits.softmax(dim=-1)
            prob_unsafe = probs[:, 0]
            logit_diff = logits_u - logits_s
            m_nsfw = float(IMAGE_CLIP_PAIR_LOGIT_MARGIN_NSFW)
            m_other = float(IMAGE_CLIP_PAIR_LOGIT_MARGIN_NON_NSFW)
            row_margins = torch.tensor(
                [
                    m_nsfw if cat == "nsfw" else m_other
                    for cat in categories
                ],
                device=logit_diff.device,
                dtype=logit_diff.dtype,
            )
            prob_unsafe = torch.where(
                logit_diff >= row_margins,
                prob_unsafe,
                torch.zeros_like(prob_unsafe),
            )

        result: dict[str, float] = {
            "nsfw": 0.0,
            "weapons": 0.0,
            "drugs": 0.0,
            "violence": 0.0,
            "hate": 0.0,
        }
        for i, cat in enumerate(categories):
            p = float(prob_unsafe[i].item())
            if p > result[cat]:
                result[cat] = p

        return result

    def clip_moderation_rows_detail(self, image_bytes: bytes) -> list[dict[str, object]]:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        device = next(self.clip_model.parameters()).device
        img_inputs = self.clip_processor(images=image, return_tensors="pt")
        pixel_values = img_inputs["pixel_values"].to(device)

        text_all = self._clip_moderation_text_feats
        categories = self._clip_moderation_flag_categories

        with torch.no_grad():
            image_out = self.clip_model.get_image_features(pixel_values=pixel_values)
            image_feat = image_out.pooler_output
            image_feat = image_feat / image_feat.norm(dim=-1, keepdim=True)

            unsafe_feats = text_all[:-1]
            safe_vec = text_all[-1:]
            scale = float(IMAGE_CLIP_LOGIT_SCALE)

            logits_u = scale * (image_feat * unsafe_feats).sum(dim=-1)
            logits_s = scale * (image_feat * safe_vec).sum(dim=-1).expand_as(logits_u)
            logits = torch.stack([logits_u, logits_s], dim=-1)
            probs = logits.softmax(dim=-1)
            prob_unsafe_raw = probs[:, 0]
            logit_diff = logits_u - logits_s
            m_nsfw = float(IMAGE_CLIP_PAIR_LOGIT_MARGIN_NSFW)
            m_other = float(IMAGE_CLIP_PAIR_LOGIT_MARGIN_NON_NSFW)
            row_margins = torch.tensor(
                [
                    m_nsfw if cat == "nsfw" else m_other
                    for cat in categories
                ],
                device=logit_diff.device,
                dtype=logit_diff.dtype,
            )
            prob_after_margin = torch.where(
                logit_diff >= row_margins,
                prob_unsafe_raw,
                torch.zeros_like(prob_unsafe_raw),
            )

        out: list[dict[str, object]] = []
        for i, cat in enumerate(categories):
            margin = float(m_nsfw if cat == "nsfw" else m_other)
            prompt = IMAGE_MODERATION_FLAGS[i][1]
            out.append(
                {
                    "index": i,
                    "category": cat,
                    "prompt": prompt,
                    "logit_diff": float(logit_diff[i].item()),
                    "margin": margin,
                    "prob_unsafe_raw": float(prob_unsafe_raw[i].item()),
                    "prob_after_margin": float(prob_after_margin[i].item()),
                    "passes_margin": bool(logit_diff[i].item() >= margin),
                }
            )
        return out

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

    async def moderate_content(
        self,
        image: UploadFile,
        threshold: float | None = None,
    ) -> tuple[bool, dict[str, float]]:
        image_bytes = await image.read()

        loop = asyncio.get_event_loop()
        probabilities = await loop.run_in_executor(
            self._executor,
            self._moderate_content_sync,
            image_bytes,
        )

        t = threshold if threshold is not None else IMAGE_MODERATION_CLIP_THRESHOLD
        t_nsfw = threshold if threshold is not None else IMAGE_MODERATION_CLIP_THRESHOLD_NSFW
        unsafe_categories = ["nsfw", "weapons", "drugs", "violence", "hate"]
        is_safe = probabilities["nsfw"] < t_nsfw and all(
            probabilities[c] < t for c in unsafe_categories if c != "nsfw"
        )

        return is_safe, probabilities

    async def moderate_text(self, text: str) -> tuple[bool, dict[str, float]]:
        loop = asyncio.get_event_loop()
        probabilities = await loop.run_in_executor(
            self._executor,
            self._moderate_text_sync,
            text,
        )

        logger.warning("Text probabilities", probabilities=probabilities)
        is_safe = all(
            probabilities[cat] < TEXT_MODERATION_DEFAULT_THRESHOLD
            for cat in TEXT_MODERATION_PATTERNS.keys()
        )

        return is_safe, probabilities

    async def get_embedding(self, text: str):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self._executor,
            self._encode_sync,
            text,
        )
