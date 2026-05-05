from fastapi import HTTPException, status


class TextModerationError(HTTPException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Неккоректный текст описания"
    
    def __init__(self, error_message: str):
        super().__init__(
            status_code=self.status_code,
            detail=f"{self.detail}: {error_message}"
        )