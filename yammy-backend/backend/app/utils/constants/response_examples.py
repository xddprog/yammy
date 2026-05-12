USER_SEARCH_RESPONSE = {
    "example": {
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "telegram_id": 123456789,
        "username": "",
        "name": "Алиса",
        "age": 24,
        "gender": "female",
        "bio": "Обожаю кодить на Python и гулять в парках. Ищу того, кто разделит мои интересы!",
        "city": "Москва",
        "job_sphere": "it",
        "job": "Senior Backend Developer",
        "relationship_goal": "serious",
        "education_level": "higher",
        "education_details": "МГТУ им. Н.Э. Баумана",
        "photos": [
            "/static/photos/alice_1.jpg",
            "/static/photos/alice_2.jpg",
            "/static/photos/alice_3.jpg",
        ],
        "filter_option_ids": [
            "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
        ],
        "match_percentage": 69,
    }
}


USER_PROFILE_RESPONSE = {
    "example": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "telegram_id": 123456789,
        "username": "alice_yammy",
        "name": "Алиса",
        "age": 24,
        "gender": "female",
        "bio": "Обожаю кодить на Python и гулять в парках. Ищу того, кто разделит мои интересы!",
        "city": "Москва",
        "job_sphere": "it",
        "job": "Senior Backend Developer",
        "relationship_goal": "serious",
        "education_level": "higher",
        "education_details": "МГТУ им. Н.Э. Баумана",
        "photos": [
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "file_path":  "/static/photos/alice_1.jpg",
                "order": 0
            },
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "file_path":  "/static/photos/alice_1.jpg",
                "order": 0
            },
        ],
        "filter_option_ids": [
            "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
        ],
        "subscription_tier": "vip",
        "subscription_expires_at": "2024-12-01T00:00:00Z",
        "superlikes_balance": 2,
        "boosts_balance": 1,
        "notifications_enabled": True,
        "language": "ru",
        "adequacy_score": 9.8,
        "referrals_count": 3,
        "referral_code": "https://t.me/yammy_bot?start=REFABCDEF12",
        "last_seen": "2023-11-20T15:30:00Z",
        "boost_expires_at": "2023-11-20T18:30:00Z"
    }
}