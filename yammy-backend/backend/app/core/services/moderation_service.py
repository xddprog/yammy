from fastapi import UploadFile
import re
from app.core.services.ml_service import MLService
from app.infrastructure.errors.image_errors import ImageProcessingError
from app.infrastructure.errors.moderation_errors import TextModerationError
from app.infrastructure.logging.logger import get_logger
from app.utils.constants.moderation_constants import (
    TEXT_MODERATION_ERROR_MESSAGES,
    IMAGE_MODERATION_ERROR_MESSAGES
)

logger = get_logger(__name__)


class ModerationService:
    def __init__(self, ml_service: MLService):
        self.ml_service = ml_service

    async def moderate_image(self, image: UploadFile, is_main: bool) -> bool:
        try:
            if image.content_type not in ["image/jpeg", "image/png", "image/webp"]:
                raise ImageProcessingError("некорректный тип файла")

            if is_main:
                faces = await self.ml_service.detect_faces(image)
                if not faces:
                    raise ImageProcessingError("на фото должно быть видно лицо")
                if len(faces) > 1:
                    raise ImageProcessingError("на фото должен быть только 1 человек")
                await image.seek(0)

            is_safe, probabilities = await self.ml_service.moderate_content(image)
            
            if not is_safe:
                unsafe_cats = {
                    cat: prob for cat, prob in probabilities.items() 
                    if prob >= 0.3
                }
                logger.warning("Unsafe content detected", categories=unsafe_cats)
                
                max_unsafe = max(
                    ((cat, prob) for cat, prob in unsafe_cats.items()),
                    default=(None, 0),
                    key=lambda x: x[1]
                )
                
                error_msg = IMAGE_MODERATION_ERROR_MESSAGES.get(
                    max_unsafe[0], 
                    "недопустимый контент"
                )
                raise ImageProcessingError(error_msg)
            
            return True
        except ImageProcessingError:
            raise
        except ValueError as e:
            logger.error("Error moderating image", error=e)
            if "This can happen if the input is too small for the given kernel size" in str(e):
                raise ImageProcessingError("на фото должно быть видно лицо")
            raise ImageProcessingError("ошибка при проверке изображения")
        except Exception as e:
            logger.error("Unexpected error moderating image", error=e, exc_info=True)
            raise ImageProcessingError("ошибка при проверке изображения")

    
    def _normalize_text(self, text: str) -> str:
        if not text:
            return ""
        
        text = text.lower()
        
        char_replacements = {
            '0': 'о', 'o': 'о', 'ó': 'о', 'ò': 'о',
            '1': 'і', 'i': 'і', '!': 'і', 'ï': 'і', 'í': 'і',
            '3': 'з', 'e': 'е', 'é': 'е', 'è': 'е', 'ë': 'е',
            '4': 'ч', 'a': 'а', '@': 'а', 'á': 'а', 'à': 'а',
            '5': 'с', '6': 'б', '7': 'г', '8': 'в', '9': 'д',
            '$': 'с', 's': 'с', 'ś': 'с',
            'c': 'с', 'k': 'к', 'ќ': 'к',
            'x': 'х', 'y': 'у', 'ý': 'у', 'ÿ': 'у',
            'p': 'р', 'h': 'н', 'ń': 'н',
            't': 'т', 'm': 'м', 'w': 'в',
            'b': 'б', 'v': 'в', 'n': 'н',
            'u': 'у', 'ú': 'у', 'ù': 'у',
        }
        
        for eng, rus in char_replacements.items():
            text = text.replace(eng, rus)
        
        text = re.sub(r'[^а-яё\s]', '', text)
        text = re.sub(r'(.)\1{2,}', r'\1', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    async def moderate_text(self, text: str) -> bool:
        try:
            if not text or len(text.strip()) < 3:
                return True
            
            normalized_text = self._normalize_text(text)
            is_safe, probabilities = await self.ml_service.moderate_text(normalized_text)
            
            if not is_safe:
                max_category = max(probabilities, key=probabilities.get)

                error_msg = TEXT_MODERATION_ERROR_MESSAGES.get(
                    max_category, 
                    "обнаружен недопустимый контент"
                )

                logger.warning(
                    "Unsafe text detected",
                    category=max_category,
                    probability=probabilities[max_category],
                    text_preview=text[:50],
                )
                raise TextModerationError(error_msg)
            return True
        except TextModerationError:
            raise
        except Exception as e:
            logger.error("Unexpected error moderating text", error=e, exc_info=True)
            raise TextModerationError("ошибка при проверке текста")
