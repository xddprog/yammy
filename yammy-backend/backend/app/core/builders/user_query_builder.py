from typing import Any
from datetime import datetime, timezone, timedelta
from app.utils.constants.enums import EducationLevelEnum, GenderEnum, JobSphereEnum, RelationshipGoalEnum
from typing_extensions import Self

class UserSearchQueryBuilder:
    def __init__(self):
        self.must_filters = []
        self.must_not_filters = []
        self.should_queries = []
        self.functions = []
        self.boost_functions = [] 
        self.size = 50
        
    def set_limit(self, limit: int):
        self.size = limit
        return self

    def add_basic_filters(
        self,
        gender: GenderEnum,
        age_min: int,
        age_max: int,
        city: str | None = None,
        goal: RelationshipGoalEnum | None = None
    ) -> Self:
        self.must_filters.append({"term": {"gender": gender}})
        self.must_filters.append({"range": {"age": {"gte": age_min, "lte": age_max}}})
        self.must_filters.append({"term": {"is_banned": False}})
        if city:
            self.must_filters.append({"term": {"city": city}})
        if goal:
            self.must_filters.append({"term": {"relationship_goal": goal}})
        return self

    def add_social_filters(
        self,
        job_sphere: JobSphereEnum | None = None,
        edu_level: EducationLevelEnum | None = None,
        edu_query: str | None = None
    ) -> Self:
        if job_sphere:
            self.must_filters.append({"terms": {"job_sphere": job_sphere}})
        
        if edu_level:
            self.must_filters.append({"terms": {"education_level": edu_level}})
            
        if edu_query:
            self.must_filters.append({
                "match": {
                    "education_details": {
                        "query": edu_query,
                        "fuzziness": "AUTO"
                    }
                }
            })
        return self

    def exclude_users(self, user_ids: list[str]) -> Self:
        if user_ids:
            self.must_not_filters.append({"ids": {"values": user_ids}})
        return self
    
    def only_boosted(self) -> Self:
        self.must_filters.append({"range": {"boost_expires_at": {"gte": "now"}}})
        return self
    
    def exclude_boosted(self) -> Self:
        self.must_not_filters.append({"range": {"boost_expires_at": {"gte": "now"}}})
        return self

    def add_trait_boosts(
        self, 
        flattened_traits: list[str], 
        weight_appearance: float, 
        weight_social: float, 
        weight_personality: float
    ) -> Self:
        for trait in flattened_traits:
            boost = 1.0
            
            if trait.startswith("appearance"):
                boost = weight_appearance * 10
                
            elif trait.startswith("social"):
                boost = weight_social * 10
                
            elif trait.startswith("personality"):
                boost = weight_personality * 10
            
            self.functions.append({
                "filter": {"term": {"specs": trait}},
                "weight": boost
            })
        return self

    def add_semantic_text_boost(
        self,
        search_text: str | None,
        weight_personality: float,
    ) -> Self:
        text = (search_text or "").strip()
        if not text:
            return self

        self.functions.append({
            "filter": {
                "multi_match": {
                    "query": text,
                    "fields": ["bio^3", "name^2", "job", "education_details"],
                    "type": "best_fields",
                    "fuzziness": "AUTO",
                }
            },
            "weight": weight_personality * 8,
        })
        return self

    def add_personality_vector(
        self, 
        vector: list[float], 
        weight_personality: float
    ) -> Self:
        if not vector:
            return self

        self.must_filters.append({"exists": {"field": "personality_vector"}})
        self.functions.append({
            "script_score": {
                "script": {
                    "source": "(cosineSimilarity(params.query_vector, 'personality_vector') + 1.0) * params.weight",
                    "params": {
                        "query_vector": vector,
                        "weight": weight_personality * 5 
                    }
                }
            }
        })
        return self

    def add_premium_filter(self, only_premium: bool) -> Self:
        if only_premium:
            self.must_filters.append({"terms": {"subscription_tier": ["premium", "vip"]}})
        return self

    def add_system_rankings(self) -> Self:
        self.boost_functions = [
            {
                "filter": {"range": {"boost_expires_at": {"gte": "now"}}},
                "weight": 5.0
            },
            {
                "field_value_factor": {
                    "field": "adequacy_score",
                    "factor": 0.1,
                    "modifier": "none",
                    "missing": 0.5
                }
            },
            {
                "gauss": {
                    "last_seen": {
                        "origin": "now",
                        "scale": "7d",
                        "decay": 0.5
                    }
                }
            }
        ]
        return self

    def for_user_ids_with_personality_functions(
        self,
        user_ids: list[str],
        personality_query_vector: list[float],
        weight_personality: float,
    ) -> Self:
        self.must_filters = [
            {"ids": {"values": user_ids}},
            {"term": {"is_banned": False}},
        ]
        if personality_query_vector:
            self.add_personality_vector(
                vector=personality_query_vector,
                weight_personality=weight_personality,
            )
        self.add_system_rankings()
        return self

    def build(self) -> dict[str, Any]:
        additive_functions = [f for f in self.functions if "filter" in f or "script_score" in f]
        multiplicative_functions = [f for f in self.functions if "gauss" in f or "field_value_factor" in f]

        base_query = {
            "bool": {
                "must": self.must_filters,
                "must_not": self.must_not_filters
            }
        }
        
        if additive_functions:
            inner_query = {
                "function_score": {
                    "query": base_query,
                    "functions": additive_functions,
                    "score_mode": "sum",
                    "boost_mode": "replace"
                }
            }
        else:
            inner_query = base_query

        if multiplicative_functions:
            final_query = {
                "function_score": {
                    "query": inner_query,
                    "functions": multiplicative_functions,
                    "score_mode": "multiply",
                    "boost_mode": "multiply"
                }
            }
        else:
            final_query = inner_query

        query_body = {
            "size": self.size,
            "query": final_query,
            "explain": False,
            "_source": {
                "excludes": ["appearance_vector"]
            }
        }
        
        if self.boost_functions:
            query_body["rescore"] = {
                "window_size": self.size,
                "query": {
                    "rescore_query": {
                        "function_score": {
                            "functions": self.boost_functions,
                            "score_mode": "multiply",
                            "boost_mode": "multiply"
                        }
                    },
                    "query_weight": 0.5,
                    "rescore_query_weight": 2.0
                }
            }
        
        return query_body