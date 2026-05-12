USER_MAPPING = {
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 1,
        "analysis": {
            "filter": {
                "russian_stop": {"type": "stop", "stopwords": "_russian_"},
                "russian_stemmer": {"type": "stemmer", "language": "russian"},
                "english_stop": {"type": "stop", "stopwords": "_english_"},
                "english_stemmer": {"type": "stemmer", "language": "english"}
            },
            "analyzer": {
                "yammy_analyzer": {
                    "type": "custom",
                    "tokenizer": "standard",
                    "filter": [
                        "lowercase",
                        "russian_stop",
                        "russian_stemmer",
                        "english_stop",
                        "english_stemmer"
                    ]
                }
            }
        }
    },
    "mappings": {
        "properties": {
            "user_id": {"type": "keyword"},
            "telegram_id": {"type": "long"},

            "username": {"type": "text"},
            "name": {"type": "text"},
            "age": {"type": "integer"},
            "gender": {"type": "keyword"},
            "city": {"type": "keyword"},
            "job": {"type": "keyword"},
            "job_sphere": {"type": "keyword"},
            "education_level": {"type": "keyword"},
            "education_details": {
                "type": "text",
                "analyzer": "yammy_analyzer",
                "fields": {"keyword": {"type": "keyword", "ignore_above": 256}},
            },
            "bio": {"type": "text", "analyzer": "yammy_analyzer"},
            "relationship_goal": {"type": "keyword"},
            
            "photos": {"type": "keyword", "index": False},

            "filter_option_ids": {"type": "keyword"},
            "specs": {"type": "keyword"},

            "subscription_tier": {"type": "keyword"},
            "subscription_expires_at": {"type": "date"},
            "superlikes_balance": {"type": "integer"},
            "boosts_balance": {"type": "integer"},
            "notifications_enabled": {"type": "boolean"},
            "language": {"type": "keyword"},

            "adequacy_score": {"type": "float"},
            "last_seen": {"type": "date"},
            "boost_expires_at": {"type": "date"},
            "is_banned": {"type": "boolean"},
            
            "personality_vector": {
                "type": "dense_vector",
                "dims": 384,
                "index": True,
                "similarity": "cosine"
            },

            "appearance_vector": {
                "type": "dense_vector",
                "dims": 512,
                "index": True,
                "similarity": "cosine"
            }
        }
    }
}