import random
from datetime import datetime, timedelta
from faker import Faker
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from passlib.context import CryptContext

from app.infrastructure.database.models.admin import Admin
from app.infrastructure.database.models.user import User, UserPhoto
from app.infrastructure.database.models.filter import FilterCategory, FilterSubcategory, FilterOption, UserFilterAssociation
from app.utils.enums import (
    GenderEnum,
    JobSphereEnum,
    RelationshipGoalEnum,
    EducationLevelEnum,
    SubscriptionTierEnum,
    UserLanguageEnum,
)
from app.infrastructure.logging.logger import get_logger
from app.core.services.ml_service import MLService
from app.core.clients.elasticsearch_client import ElasticsearchClient
from app.core.dto.user import UserSearchResponseSchema


logger = get_logger(__name__)
fake = Faker(['ru_RU'])

COMMON_BIO_TEMPLATES = {
    GenderEnum.FEMALE: [
        "Люблю прогулки, путешествия и уютные вечера. Ценю заботу, юмор и искренность.",
        "Обожаю спорт, книги и хорошую музыку. Ищу человека с похожими ценностями.",
        "Нравится развиваться, пробовать новое и путешествовать. Важны уважение и честность.",
        "Фотография, йога и саморазвитие - мои главные увлечения. Хочу встретить интересного собеседника.",
        "Обожаю готовить, смотреть сериалы и гулять с собакой. Ищу того, с кем будет комфортно.",
        "Танцы, искусство и хорошее вино - то, что люблю. Важна эмоциональная связь.",
        "Работаю в творческой сфере, увлекаюсь дизайном и модой. Ценю стиль и вкус.",
        "Активный образ жизни, бег по утрам, здоровое питание. Ищу партнера для совместных тренировок.",
        "Книжный червь, люблю философию и психологию. Хочу найти человека для глубоких разговоров.",
        "Путешествия - моя страсть! Была в 20 странах, хочу еще больше. Ищу попутчика по жизни.",
        "Интроверт, домосед, люблю тишину и уют. Ценю спокойствие и взаимопонимание.",
        "Экстраверт, обожаю вечеринки, новые знакомства. Ищу того, кто разделит мою энергию.",
        "Карьеристка, амбициозная, целеустремленная. Хочу встретить такого же успешного человека.",
        "Мама двоих детей, ищу серьезные отношения. Ценю честность и ответственность.",
        "Фрилансер, работаю удаленно, много путешествую. Ищу свободного духом человека."
    ],
    GenderEnum.MALE: [
        "Люблю спорт, путешествия и активный отдых. Ценю уважение, юмор и честность.",
        "Интересуюсь технологиями, музыкой и путешествиями. Ищу близкого по духу человека.",
        "Нравятся новые впечатления, спорт и книги. Важны доверие и поддержка.",
        "Программист, гик, люблю игры и новые технологии. Ищу такую же технофила.",
        "Занимаюсь бизнесом, люблю риск и новые вызовы. Ценю амбициозность.",
        "Музыкант, играю на гитаре, пишу песни. Хочу найти свою музу.",
        "Спортсмен, тренируюсь каждый день, слежу за здоровьем. Ищу активную девушку.",
        "Интроверт, предпочитаю тихие вечера дома с книгой. Ценю уют и спокойствие.",
        "Экстраверт, душа компании, люблю веселье. Ищу партнершу для приключений.",
        "Творческая личность, художник, фотограф. Хочу найти свою модель и вдохновение.",
        "Путешественник, объездил полмира. Ищу попутчицу для новых приключений.",
        "Финансист, люблю стабильность и порядок. Ценю рациональность и планирование.",
        "Повар, обожаю экспериментировать на кухне. Хочу готовить для любимой.",
        "Байкер, люблю скорость и свободу. Ищу смелую девушку на заднее сиденье.",
        "Ученый, работаю в исследовательской лаборатории. Ищу умную собеседницу."
    ]
}

HIGH_MATCH_SHARE = 0.35

INITIAL_FILTERS = [
    {
        "name": "Внешность",
        "slug": "appearance",
        "subcategories": [
            {
                "name": "Волосы",
                "slug": "hair",
                "options": [
                    {"name": "Длинные", "slug": "long"},
                    {"name": "Каре", "slug": "bob"},
                    {"name": "Короткие", "slug": "short"},
                    {"name": "Лысый", "slug": "bald"},
                ]
            },
            {
                "name": "Телосложение",
                "slug": "body",
                "options": [
                    {"name": "Спортивное", "slug": "athletic"},
                    {"name": "Худощавое", "slug": "slim"},
                    {"name": "Плотное", "slug": "muscular"},
                    {"name": "Среднее", "slug": "average"},
                ]
            },
            {
                "name": "Стиль",
                "slug": "style",
                "options": [
                    {"name": "Классика", "slug": "classic"},
                    {"name": "Спортивный", "slug": "sporty"},
                    {"name": "Кэжуал", "slug": "casual"},
                    {"name": "Уличный", "slug": "street"},
                ]
            }
        ]
    },
    {
        "name": "Интересы",
        "slug": "interests",
        "subcategories": [
            {
                "name": "Спорт",
                "slug": "sport",
                "options": [
                    {"name": "Зал", "slug": "gym"},
                    {"name": "Йога", "slug": "yoga"},
                    {"name": "Бег", "slug": "running"},
                    {"name": "Плавание", "slug": "swimming"},
                ]
            },
            {
                "name": "Хобби",
                "slug": "hobby",
                "options": [
                    {"name": "Путешествия", "slug": "travel"},
                    {"name": "Кино", "slug": "cinema"},
                    {"name": "Книги", "slug": "books"},
                    {"name": "Музыка", "slug": "music"},
                    {"name": "Фото", "slug": "photo"},
                ]
            }
        ]
    },
    {
        "name": "Лайфстайл",
        "slug": "lifestyle",
        "subcategories": [
            {
                "name": "Питомцы",
                "slug": "pets",
                "options": [
                    {"name": "Кошки", "slug": "cats"},
                    {"name": "Собаки", "slug": "dogs"},
                    {"name": "Нет", "slug": "none"},
                ]
            },
            {
                "name": "Режим дня",
                "slug": "routine",
                "options": [
                    {"name": "Жаворонок", "slug": "morning"},
                    {"name": "Сова", "slug": "night"},
                ]
            }
        ]
    }
]

async def init_test_db(session: AsyncSession, count: int = 50) -> None:
    try:
        admin_exists = (await session.execute(select(Admin))).scalars().first()
        if not admin_exists:
            pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
            admin = Admin(username="admin", password_hash=pwd_context.hash("admin"))
            session.add(admin)
            logger.info("Admin created")

        filters_exist = (await session.execute(select(FilterCategory))).scalars().first()
        if not filters_exist:
            for cat_data in INITIAL_FILTERS:
                category = FilterCategory(name=cat_data["name"], slug=cat_data["slug"])
                session.add(category)
                await session.flush()
                for sub_data in cat_data["subcategories"]:
                    subcategory = FilterSubcategory(
                        category_id=category.id, name=sub_data["name"], slug=sub_data["slug"]
                    )
                    session.add(subcategory)
                    await session.flush()
                    for opt_data in sub_data["options"]:
                        option = FilterOption(
                            subcategory_id=subcategory.id, name=opt_data["name"], slug=opt_data["slug"]
                        )
                        session.add(option)
            await session.flush()
            logger.info("Filters seeded")

        all_options = (await session.execute(select(FilterOption))).scalars().all()

        logger.info(f"Starting generation of {count} users...")
        for i in range(count):
            gender = random.choice(list(GenderEnum))
            name = fake.name_female() if gender == GenderEnum.FEMALE else fake.name_male()
            is_high_match = random.random() < HIGH_MATCH_SHARE
            # Всегда используем шаблоны, чтобы био были реалистичными и разнообразными
            bio = random.choice(COMMON_BIO_TEMPLATES[gender])
            
            user = User(
                telegram_id=random.randint(100000, 999999999),
                name=name.split()[0],
                age=random.randint(18, 45),
                gender=gender,
                bio=bio,
                city=random.choice(["Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Сочи"]),
                job_sphere=random.choice(list(JobSphereEnum)),
                job=fake.job(),
                relationship_goal=random.choice(list(RelationshipGoalEnum)),
                education_level=random.choice(list(EducationLevelEnum)),
                education_details=random.choice([
                    "МГУ им. М.В. Ломоносова",
                    "СПбГУ",
                    "МГТУ им. Н.Э. Баумана",
                    "НИУ ВШЭ",
                    "МФТИ",
                    "КФУ",
                    "УрФУ",
                    "ИТМО"
                ]) if random.random() > 0.3 else None,
                
                subscription_tier=random.choice(list(SubscriptionTierEnum)),
                adequacy_score=round(random.uniform(9.0, 10.0), 1) if is_high_match else round(random.uniform(5.0, 10.0), 1),
                last_seen=datetime.now() - timedelta(minutes=random.randint(0, 120)) if is_high_match else datetime.now() - timedelta(minutes=random.randint(0, 10000)),
                referral_code=f"REF{random.randint(1000, 9999)}{i}",
                notifications_enabled=random.random() > 0.4,
                boost_expires_at=datetime.now() + timedelta(hours=2) if is_high_match else (datetime.now() + timedelta(hours=2) if random.random() > 0.9 else None),
                language=random.choice(list(UserLanguageEnum)),
            )
            
            session.add(user)
            await session.flush()

            for order in range(random.randint(1, 3)):
                photo = UserPhoto(
                    user_id=user.id,
                    file_path=f"/static/test_photos/photo_{random.randint(1, 10)}.jpg",
                    order=order,
                    is_main=(order == 0),
                )
                session.add(photo)

            # Увеличиваем количество характеристик для лучшего matching
            num_traits = random.randint(8, 15) if is_high_match else random.randint(6, 12)
            random_traits = random.sample(all_options, k=min(num_traits, len(all_options)))
            for trait in random_traits:
                user_filter = UserFilterAssociation(
                    user_id=user.id,
                    option_id=trait.id
                )
                session.add(user_filter)

        await session.commit()
        logger.info(f"Successfully seeded {count} users")

    except Exception as e:
        await session.rollback()
        logger.error(f"Seeding failed: {str(e)}", exc_info=True)
        raise


async def sync_test_users_to_es(
    session: AsyncSession, 
    es_client: ElasticsearchClient, 
    ml_service: MLService
) -> None:
    try:
        logger.info("Checking users index state before sync...")

        existing_docs_response = await es_client.search(
            index="users",
            query={
                "size": 0,
                "track_total_hits": True,
                "query": {"match_all": {}},
            },
        )
        total_hits = existing_docs_response.get("hits", {}).get("total", 0)
        if isinstance(total_hits, dict):
            total_hits = total_hits.get("value", 0)

        if total_hits > 0:
            logger.info(
                f"Skip Elasticsearch sync: users index already contains {total_hits} documents"
            )
            return

        logger.info("Users index is empty. Starting mass synchronization to Elasticsearch...")

        stmt = (
            select(User)
            .options(
                selectinload(User.photos),
                selectinload(User.filters)
                .selectinload(FilterOption.subcategory)
                .selectinload(FilterSubcategory.category)
            )
        )
        result = await session.execute(stmt)
        users = result.scalars().all()
        logger.info(f"Found {len(users)} users in database")

        if not users:
            logger.warning("No users found in database to sync.")
            return

        all_options = (await session.execute(select(FilterOption))).scalars().all()
        logger.info(f"Found {len(all_options)} filter options")

        es_operations = []

        for i, user in enumerate(users):
            es_data = UserSearchResponseSchema.model_validate(user, from_attributes=True)

            trait_names = [f.name for f in user.filters]
            text_for_vector = f"{user.name}. {user.bio or ''}. {user.job or ''}. {', '.join(trait_names)}"

            personality_vector = await ml_service.get_embedding(text_for_vector)

            # Увеличиваем количество preferences для более реалистичного matching
            search_prefs = random.sample(all_options, k=min(random.randint(6, 12), len(all_options)))
            prefs_dict = {}
            for opt in search_prefs:
                cat_slug = opt.subcategory.category.slug
                sub_slug = opt.subcategory.slug
                if cat_slug not in prefs_dict:
                    prefs_dict[cat_slug] = {}
                if sub_slug not in prefs_dict[cat_slug]:
                    prefs_dict[cat_slug][sub_slug] = []
                prefs_dict[cat_slug][sub_slug].append(opt.slug)

            doc_dict = es_data.model_dump()
            doc_dict["personality_vector"] = personality_vector
            doc_dict["filters"] = prefs_dict

            es_operations.append(doc_dict)

            if (i + 1) % 10 == 0:
                logger.info(f"Processed {i + 1}/{len(users)} users")

        if es_operations:
            logger.info(f"Starting bulk index of {len(es_operations)} users to Elasticsearch...")
            result = await es_client.bulk_index(
                index="users",
                documents=es_operations
            )
            logger.info(
                f"Successfully synced {len(es_operations)} users to Elasticsearch. "
                f"Result: {result.get('errors', False)}"
            )
    except Exception as e:
        logger.error(f"Elasticsearch sync failed: {str(e)}", exc_info=True)
        raise
    