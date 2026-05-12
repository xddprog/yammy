import asyncio
from uuid import UUID
from app.core.repositories.user_repository import UserRepository
from app.core.repositories.like_repository import LikeRepository
from app.core.repositories.appearance_rating_repository import AppearanceRatingRepository
from app.core.clients.elasticsearch_client import ElasticsearchClient
from app.core.services.ml_service import MLService
from app.core.clients.redis_client import RedisClient
from app.core.dto.search import SearchRequest
from app.core.dto.user import UserSearchResponseSchema
from app.core.dto.appearance_rating import AppearanceRatingSchema
from app.core.builders.user_query_builder import UserSearchQueryBuilder
from app.infrastructure.database.models.user import User
from app.utils.constants.cache_keys import UserCacheKeys, AppearanceRatingCacheKeys



class SearchService:
    SEEN_TTL = 30 * 24 * 60 * 60
    APPEARANCE_RATED_TTL = 60 * 60 
    
    def __init__(
        self, 
        user_repository: UserRepository,
        like_repository: LikeRepository,
        appearance_rating_repository: AppearanceRatingRepository,
        elasticsearch_client: ElasticsearchClient, 
        ml_service: MLService, 
        redis_client: RedisClient,
    ):
        self.user_repository = user_repository
        self.like_repository = like_repository
        self.appearance_rating_repository = appearance_rating_repository
        self.elasticsearch_client = elasticsearch_client
        self.ml_service = ml_service
        self.redis_client = redis_client
        self.BOOSTED_LIMIT = 10
        self.REGULAR_LIMIT = 40
        self.MIN_MATCH_PERCENTAGE = 30
        self.FINAL_LIMIT = 20
    
    def _create_base_query_builder(
        self,
        search_request: SearchRequest,
        user_vector,
        exclude_list: list[str]
    ) -> UserSearchQueryBuilder:
        return (
            UserSearchQueryBuilder()
            .add_basic_filters(
                gender=search_request.gender,
                age_min=search_request.age_min,
                age_max=search_request.age_max,
                city=search_request.city,
                goal=search_request.relationship_goal
            )
            .add_social_filters(
                job_sphere=search_request.job_spheres,
                edu_level=search_request.education_levels,
                edu_query=search_request.education_details,
            )
            .add_premium_filter(search_request.only_premium)
            .exclude_users(exclude_list)
            .add_trait_boosts(
                flattened_traits=search_request.filters,
                weight_appearance=search_request.weight_appearance,
                weight_social=search_request.weight_social,
                weight_personality=search_request.weight_personality
            )
            .add_personality_vector(
                vector=user_vector,
                weight_personality=search_request.weight_personality
            )
            .add_system_rankings()
        )
    
    async def _execute_search(self, builder: UserSearchQueryBuilder) -> list[dict]:
        query = builder.build()
        response = await self.elasticsearch_client.search(index="users", query=query)
        return response.get("hits", {}).get("hits", [])
    
    def _extract_user_specs(self, user: User) -> list[str]:
        if not user or not hasattr(user, 'filters'):
            return []
        specs = []
        for filter_option in user.filters:
            cat_slug = filter_option.subcategory.category.slug
            sub_slug = filter_option.subcategory.slug
            opt_slug = filter_option.slug
            specs.append(f"{cat_slug}:{sub_slug}:{opt_slug}")
        return specs
    
    def _flatten_filters_dict(self, filters_dict: dict) -> list[str]:
        flattened = []
        for cat_slug, subcategories in filters_dict.items():
            for sub_slug, option_codes in subcategories.items():
                for code in option_codes:
                    flattened.append(f"{cat_slug}:{sub_slug}:{code}")
        return flattened
    
    def _calculate_backward_match(self, my_specs: list[str], candidate_wants: list[str]) -> int:
        if not candidate_wants:
            return 50
        if not my_specs:
            return 0
        
        matched = sum(1 for spec in candidate_wants if spec in my_specs)
        
        recall = matched / len(candidate_wants)
        precision = matched / len(my_specs)
        
        avg_match = (recall + precision) / 2
        return int(avg_match * 100)
    
    def _parse_vector(self, vector_data):
        import json
        if isinstance(vector_data, bytes):
            vector_data = vector_data.decode('utf-8')
        if isinstance(vector_data, str):
            return json.loads(vector_data)
        return vector_data
    
    def _cosine_similarity(self, vec1: list[float], vec2: list[float]) -> float:
        if not vec1 or not vec2:
            return 0.0
        if len(vec1) != len(vec2):
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(b * b for b in vec2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)

    async def search_users(self, search_request: SearchRequest, current_user: User) -> list[UserSearchResponseSchema]:
        seen_key = UserCacheKeys.SEEN_USERS.format(user_id=current_user.id)
        seen_ids = await self.redis_client.smembers(seen_key)
        
        if not seen_ids:
            seen_ids = await self.like_repository.get_all_seen_user_ids(current_user.id)
            if seen_ids:
                await self.redis_client.sadd(seen_key, *seen_ids, ttl=self.SEEN_TTL)
        
        exclude_list = [str(current_user.id)] + list(seen_ids)

        user_vector = await self.redis_client.get(UserCacheKeys.USER_VECTOR.format(user_id=current_user.id))

        if not user_vector:
            user_vector = await self.ml_service.get_embedding(current_user.bio)
        
        current_user_with_filters = await self.user_repository.get_user_with_filters(current_user.id)
        my_specs = self._extract_user_specs(current_user_with_filters)
        
        boosted_hits, regular_hits = await asyncio.gather(
            self._execute_search(
                self._create_base_query_builder(search_request, user_vector, exclude_list)
                .set_limit(self.BOOSTED_LIMIT)
                .only_boosted()
            ),
            self._execute_search(
                self._create_base_query_builder(search_request, user_vector, exclude_list)
                .set_limit(self.REGULAR_LIMIT)
                .exclude_boosted()
            )
        )
        
        all_hits = boosted_hits + regular_hits
        
        results = []
        for hit in all_hits:
            source = hit["_source"]
            
            candidate_vector = source.get("personality_vector")
            if candidate_vector and user_vector:
                parsed_user_vector = self._parse_vector(user_vector)
                personality_similarity = self._cosine_similarity(parsed_user_vector, candidate_vector)
                forward_match = int(((personality_similarity + 1) / 2) * 100)
            else:
                forward_match = 50
            
            candidate_filters = self._flatten_filters_dict(source.get("filters", {}))
            backward_match = self._calculate_backward_match(my_specs, candidate_filters)
            
            match_percentage = int((forward_match + backward_match) / 2)
            
            if match_percentage >= self.MIN_MATCH_PERCENTAGE:
                source["match_percentage"] = match_percentage
                results.append(UserSearchResponseSchema.model_validate(source))
        
        return results[:self.FINAL_LIMIT]
    
    async def get_users_for_appearance_rating(self, current_user_id: UUID, limit: int = 20) -> list[AppearanceRatingSchema]:
        rated_key = AppearanceRatingCacheKeys.APPEARANCE_RATED_USERS.format(user_id=current_user_id)
        rated_ids = await self.redis_client.smembers(rated_key)
        
        if not rated_ids:
            rated_ids = await self.appearance_rating_repository.get_all_rated_user_ids(current_user_id)
            if rated_ids:
                await self.redis_client.sadd(rated_key, *rated_ids, ttl=self.APPEARANCE_RATED_TTL)
        
        exclude_list = [current_user_id] + [UUID(rid) for rid in rated_ids]
        
        users = await self.user_repository.get_random_users_with_photos(exclude_list, limit)
        
        return [
            AppearanceRatingSchema.model_validate(user, from_attributes=True)
            for user in users
        ]