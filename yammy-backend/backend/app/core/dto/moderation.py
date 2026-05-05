from pydantic import BaseModel


class ModerateTextRequest(BaseModel):
    text: str
