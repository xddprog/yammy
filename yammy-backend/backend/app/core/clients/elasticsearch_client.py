from typing import Any, Dict, List, Optional

from elasticsearch import AsyncElasticsearch

from app.infrastructure.config.config import ELASTICSEARCH_CONFIG
from app.infrastructure.elasticsearch.mappings import ALL_INDICES
from app.infrastructure.logging.logger import get_logger


logger = get_logger()


class ElasticsearchClient:
    def __init__(self) -> None:
        es_config = {
            "hosts": [{
                "host": ELASTICSEARCH_CONFIG.ES_HOST,
                "port": ELASTICSEARCH_CONFIG.ES_PORT,
                "scheme": ELASTICSEARCH_CONFIG.ES_SCHEME,
            }]
        }
        
        if ELASTICSEARCH_CONFIG.ES_USER and ELASTICSEARCH_CONFIG.ES_PASSWORD:
            es_config["basic_auth"] = (
                ELASTICSEARCH_CONFIG.ES_USER,
                ELASTICSEARCH_CONFIG.ES_PASSWORD
            )
        
        self.client: AsyncElasticsearch = AsyncElasticsearch(**es_config)

    async def close(self) -> None:
        await self.client.close()

    async def index_document(
        self,
        index: str,
        document: Dict[str, Any],
        doc_id: Optional[str] = None
    ) -> Dict[str, Any]:
        return await self.client.index(
            index=index,
            id=doc_id,
            document=document
        )

    async def get_document(
        self,
        index: str,
        doc_id: str
    ) -> Optional[Dict[str, Any]]:
        try:
            response = await self.client.get(index=index, id=doc_id)
            return response["_source"]
        except Exception:
            return None

    async def search(
        self,
        index: str,
        query: Dict[str, Any],
    ) -> Dict[str, Any]:
        return await self.client.search(
            index=index,
            body=query
        )

    async def update_document(
        self,
        index: str,
        doc_id: str,
        document: Dict[str, Any]
    ) -> Dict[str, Any]:
        return await self.client.update(
            index=index,
            id=doc_id,
            doc=document
        )

    async def delete_document(
        self,
        index: str,
        doc_id: str
    ) -> Dict[str, Any]:
        return await self.client.delete(index=index, id=doc_id)

    async def bulk_index(
        self,
        index: str,
        documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        operations = []
        for doc in documents:
            doc_id = doc.get("user_id") or doc.get("id")
            operations.append({"index": {"_index": index, "_id": doc_id}})
            operations.append(doc)
        
        return await self.client.bulk(operations=operations)

    async def index_exists(self, index: str) -> bool:
        return await self.client.indices.exists(index=index)

    async def create_index(
        self,
        index: str,
        mappings: Optional[Dict[str, Any]] = None,
        settings: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return await self.client.indices.create(
            index=index,
            mappings=mappings,
            settings=settings
        )

    async def delete_index(self, index: str) -> Dict[str, Any]:
        return await self.client.indices.delete(index=index)

    async def init_indices(self) -> None:
        for index_name, mapping in ALL_INDICES.items():
            exists = await self.index_exists(index_name)
            if not exists:
                await self.create_index(
                    index=index_name,
                    mappings=mapping.get("mappings"),
                    settings=mapping.get("settings")
                )
                logger.info("Successfully created index", index_name=index_name)
            else:
                logger.info("Index already exists", index_name=index_name)