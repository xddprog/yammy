from pydantic import BaseModel, Field, field_validator
from app.utils.constants.enums import GenderEnum, JobSphereEnum, RelationshipGoalEnum, EducationLevelEnum

class SearchRequest(BaseModel):
    gender: GenderEnum
    age_min: int = Field(default=18, ge=13, le=100)
    age_max: int = Field(default=100, ge=13, le=100)
    relationship_goal: RelationshipGoalEnum | None = None
    city: str | None = None

    job_spheres: list[JobSphereEnum] | None = None

    education_levels: list[EducationLevelEnum] | None = None
    education_details: str | None = None

    search_text: str | None = Field(default=None, max_length=500)

    filters: dict[str, dict[str, list[str]]] | list[str] = Field(default_factory=dict)

    weight_appearance: float = Field(default=0.33, ge=0.0, le=1.0)
    weight_social: float = Field(default=0.33, ge=0.0, le=1.0)
    weight_personality: float = Field(default=0.33, ge=0.0, le=1.0)

    only_online: bool = False
    only_premium: bool = False
    show_seen: bool = False

    @field_validator("search_text", mode="before")
    @classmethod
    def normalize_search_text(cls, v: str | None) -> str | None:
        if v is None:
            return None
        stripped = v.strip()
        return stripped or None

    @field_validator("filters", mode="before")
    @classmethod
    def validate_filters(cls, v: dict[str, dict[str, list[str]]] | list[str]) -> list[str]:
        if isinstance(v, list):
            return v
        
        flattened = []
        for cat_slug, subcategories in v.items():
            for sub_slug, option_codes in subcategories.items():
                for code in option_codes:
                    tag = f"{cat_slug}:{sub_slug}:{code}"
                    flattened.append(tag)
        return flattened

    class Config:
        json_schema_extra={
            "example": {
                "gender": "female",
                "age_min": 22,
                "age_max": 28,
                "relationship_goal": "dating",
                "city": "Москва",
                "job_spheres": ["it", "art_design"],
                "education_levels": ["higher"],
                "education_details": "МГУ",
                "search_text": "любит путешествия и активный отдых",
                "filters": {
                    "appearance": {
                        "hair": ["bob", "long"],
                        "style": ["classic"]
                    },
                    "lifestyle": {
                        "routine": ["owl"],
                        "pets": ["cats"]
                    }
                },
                "weight_appearance": 0.7,
                "weight_social": 0.2,
                "weight_personality": 0.1,
                "only_online": True,
                "only_premium": False,
                "show_seen": False,
            }
        }