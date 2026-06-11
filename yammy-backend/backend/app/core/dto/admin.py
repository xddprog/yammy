from pydantic import BaseModel
from uuid import UUID

class BaseAdminSchema(BaseModel):
    pass


class AdminBanUserRequest(BaseModel):
    is_banned: bool