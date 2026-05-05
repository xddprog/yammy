import asyncio
import io
import re
from concurrent.futures import ThreadPoolExecutor
from fastapi import UploadFile
from PIL import Image
import torch
from mtcnn.utils.images import load_image
from sentence_transformers import SentenceTransformer, util
from mtcnn import MTCNN
from transformers import CLIPModel, CLIPProcessor
from app.utils.moderation_constants import (
    TEXT_MODERATION_PATTERNS,
    IMAGE_MODERATION_CATEGORIES,
    TEXT_SIMILARITY_MIN,
    TEXT_SIMILARITY_MAX
)
from app.infrastructure.logging.logger import get_logger

logger = get_logger(__name__)

class MLService:
    def __init__(self) -> None:
        self.embeddings_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        self.face_detection_model = MTCNN(device="CPU:0")
        self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self._executor = ThreadPoolExecutor(max_workers=4)
        
        self._cached_pattern_embeddings = self._precompute_pattern_embeddings()

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
                    padding=True
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
            
            normalized = max(0.0, min(1.0, 
                (max_similarity - TEXT_SIMILARITY_MIN) / (TEXT_SIMILARITY_MAX - TEXT_SIMILARITY_MIN)))
            
            result[category] = normalized
        
        return result

    async def detect_faces(self, image: UploadFile):
        image_bytes = await image.read()
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self._executor,
            self._detect_faces_sync,
            image_bytes
        )

    async def moderate_content(self, image: UploadFile, threshold: float = 0.3) -> tuple[bool, dict[str, float]]:
        image_bytes = await image.read()
        
        loop = asyncio.get_event_loop()
        probabilities = await loop.run_in_executor(
            self._executor,
            self._moderate_content_sync,
            image_bytes
        )
        
        unsafe_categories = ["nsfw", "weapons", "drugs", "violence", "hate"]
        is_safe = all(probabilities[cat] < threshold for cat in unsafe_categories)
        
        return is_safe, probabilities

    async def moderate_text(self, text: str, threshold: float = 0.3) -> tuple[bool, dict[str, float]]:
        loop = asyncio.get_event_loop()
        probabilities = await loop.run_in_executor(
            self._executor,
            self._moderate_text_sync,
            text
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
            text
        )