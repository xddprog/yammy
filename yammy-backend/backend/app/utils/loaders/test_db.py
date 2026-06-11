import random
import shutil
import uuid
from datetime import datetime, timedelta
from faker import Faker
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from passlib.context import CryptContext

from dishka import AsyncContainer

from app.infrastructure.database.models.admin import Admin
from app.infrastructure.database.models.chat import Chat
from app.infrastructure.database.models.like import Like
from app.infrastructure.database.models.match import Match
from app.infrastructure.database.models.message import Message
from app.infrastructure.database.models.user import User, UserPhoto
from app.infrastructure.database.models.filter import FilterCategory, FilterSubcategory, FilterOption, UserFilterAssociation
from app.utils.constants.enums import (
    GenderEnum,
    JobSphereEnum,
    RelationshipGoalEnum,
    EducationLevelEnum,
    SubscriptionTierEnum,
    UserLanguageEnum,
    LikeTypeEnum,
)
from app.infrastructure.config.config import BASE_DIR
from app.infrastructure.logging.logger import get_logger
from app.core.services.ml_service import MLService
from app.core.services.user_index_service import UserIndexService
from app.core.repositories.user_repository import UserRepository
from app.core.clients.elasticsearch_client import ElasticsearchClient
from app.core.dto.filter import FilterCategorySchema


logger = get_logger(__name__)
fake = Faker(['ru_RU'])

TEST_MODERATION_NORMAL_DIR = BASE_DIR / "test_moderation" / "normal"
# Как у ImageService: файлы в static/images/, в БД — относительный путь (get_absolute_url → STATIC_URL).
TEST_SEED_PHOTOS_DIR = BASE_DIR / "static" / "images" / "test_photos"

TEST_SEED_PHOTO_FILENAMES: tuple[str, ...] = (
    "photo_2026-05-11_13-17-12.jpg",
    "photo_2026-05-11_13-17-25.jpg",
    "photo_2026-05-11_13-17-49.jpg",
    "photo_2026-05-11_13-18-23.jpg",
    "photo_2026-05-11_13-18-36.jpg",
    "photo_2026-05-11_13-18-46.jpg",
    "photo_2026-05-11_13-31-27.jpg",
    "photo_2026-05-11_13-31-38.jpg",
    "photo_2026-05-11_13-31-56.jpg",
    "photo_2026-05-11_13-31-58.jpg",
    "photo_2026-05-11_13-32-03.jpg",
)


def ensure_test_profile_photos_synced() -> list[str]:
    """Копирует фиксированный набор фото в static/images/test_photos для сида."""
    TEST_SEED_PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
    db_paths: list[str] = []
    missing: list[str] = []

    for name in TEST_SEED_PHOTO_FILENAMES:
        src = TEST_MODERATION_NORMAL_DIR / name
        if not src.is_file():
            missing.append(name)
            continue
        dest = TEST_SEED_PHOTOS_DIR / name
        if not dest.exists() or dest.stat().st_mtime < src.stat().st_mtime:
            shutil.copy2(src, dest)
        db_paths.append(f"test_photos/{name}")

    if missing:
        raise RuntimeError(
            f"Missing test seed photos in {TEST_MODERATION_NORMAL_DIR}: {', '.join(missing)}"
        )
    if not db_paths:
        raise RuntimeError("Test seed photo list is empty")

    logger.info(
        "test_profile_photos_synced",
        photo_count=len(db_paths),
        static_dir=str(TEST_SEED_PHOTOS_DIR),
    )
    return db_paths


def pick_test_photo_paths(pool: list[str], count: int) -> list[str]:
    if not pool or count <= 0:
        return []
    k = min(count, len(pool))
    return random.sample(pool, k=k)

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
LIKES_SEED_COUNT_PER_USER = 12
SUPERLIKE_SEED_CREATED_INDICES = {1, 4}
SUPERLIKE_SEED_MESSAGES: tuple[str, str] = (
    "Не смог пройти мимо твоей анкеты — очень зацепила улыбка.",
    "Кажется, у нас может получиться классный разговор. Давай проверим?",
)

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


# --- Калибровка мэтча: якорный пользователь + «близнецы» (высокий %) и контраст (низкий %) ---
MATCH_ANCHOR_TELEGRAM_ID = 9_000_000_001
MATCH_HIGH_TELEGRAM_START = 9_000_000_002
MATCH_LOW_TELEGRAM_START = 9_000_000_010

BIO_MATCH_CALIBRATION_ANCHOR = (
    "Йога по утрам, книги на вечер, выходные — горы или море. Ищу спокойного человека: "
    "без драм, с чувством юмора, любовью к путешествиям и котам. Важны честность и уважение к личным границам."
)

BIO_MATCH_CALIBRATION_LOW = (
    "Работаю в инвестбанке, шестидневка, зал в 6:00, без кофе не просыпаюсь. "
    "Интересуют только кейсы, цифры и сделки; про йогу, сериалы и котов не пишу — не моя вселенная."
)

ANCHOR_TRAIT_TRIPLES: list[tuple[str, str, str]] = [
    ("appearance", "hair", "long"),
    ("appearance", "body", "slim"),
    ("appearance", "style", "casual"),
    ("interests", "sport", "yoga"),
    ("interests", "hobby", "books"),
    ("interests", "hobby", "travel"),
    ("interests", "hobby", "music"),
    ("interests", "sport", "running"),
    ("lifestyle", "pets", "cats"),
    ("lifestyle", "routine", "morning"),
]

LOW_CONTRAST_TRAIT_TRIPLES: list[tuple[str, str, str]] = [
    ("appearance", "hair", "bald"),
    ("appearance", "style", "street"),
    ("interests", "sport", "gym"),
    ("lifestyle", "pets", "dogs"),
    ("lifestyle", "routine", "night"),
    ("interests", "hobby", "cinema"),
    ("interests", "hobby", "music"),
    ("interests", "hobby", "books"),
]


async def _filter_option_map_by_triple(session: AsyncSession) -> dict[tuple[str, str, str], FilterOption]:
    stmt = select(FilterOption).options(
        joinedload(FilterOption.subcategory).joinedload(FilterSubcategory.category),
    )
    rows = (await session.execute(stmt)).unique().scalars().all()
    out: dict[tuple[str, str, str], FilterOption] = {}
    for opt in rows:
        key = (opt.subcategory.category.slug, opt.subcategory.slug, opt.slug)
        out[key] = opt
    return out


async def seed_match_calibration_users(
    session: AsyncSession,
    *,
    photo_paths: list[str],
) -> None:
    """Детерминированные анкеты для проверки высокого и низкого match_percentage (см. SearchService)."""
    if await session.scalar(select(User.id).where(User.telegram_id == MATCH_ANCHOR_TELEGRAM_ID)):
        return

    triple_map = await _filter_option_map_by_triple(session)
    missing = [t for t in ANCHOR_TRAIT_TRIPLES if t not in triple_map]
    if missing:
        logger.warning("match_calibration_skip_missing_traits", missing=missing)
        return

    anchor_options = [triple_map[t] for t in ANCHOR_TRAIT_TRIPLES]
    low_missing = [t for t in LOW_CONTRAST_TRAIT_TRIPLES if t not in triple_map]
    if low_missing:
        logger.warning("match_calibration_skip_low_missing", missing=low_missing)
        return
    low_options = [triple_map[t] for t in LOW_CONTRAST_TRAIT_TRIPLES]

    async def add_user_with_traits(
        *,
        telegram_id: int,
        first_name: str,
        bio: str,
        gender: GenderEnum,
        age: int,
        options: list[FilterOption],
        photo_paths: list[str],
    ) -> None:
        u = User(
            telegram_id=telegram_id,
            name=first_name,
            age=age,
            gender=gender,
            bio=bio,
            city="Москва",
            job_sphere=JobSphereEnum.IT,
            job="Калибровка ленты",
            relationship_goal=RelationshipGoalEnum.RELATIONSHIP,
            education_level=EducationLevelEnum.HIGHER,
            education_details="СПбГУ",
            subscription_tier=SubscriptionTierEnum.FREE,
            adequacy_score=9.5,
            last_seen=datetime.now() - timedelta(minutes=5),
            referral_code=f"REFCAL{telegram_id}",
            notifications_enabled=True,
            profile_moderation_approved=True,
            language=UserLanguageEnum.RU,
        )
        session.add(u)
        await session.flush()
        for order, file_path in enumerate(pick_test_photo_paths(photo_paths, 1)):
            session.add(
                UserPhoto(
                    user_id=u.id,
                    file_path=file_path,
                    order=order,
                    is_main=(order == 0),
                )
            )
        for opt in options:
            session.add(UserFilterAssociation(user_id=u.id, option_id=opt.id))
        await session.flush()

    await add_user_with_traits(
        telegram_id=MATCH_ANCHOR_TELEGRAM_ID,
        first_name="Якорь",
        bio=BIO_MATCH_CALIBRATION_ANCHOR,
        gender=GenderEnum.FEMALE,
        age=27,
        options=anchor_options,
        photo_paths=photo_paths,
    )

    for i in range(6):
        await add_user_with_traits(
            telegram_id=MATCH_HIGH_TELEGRAM_START + i,
            first_name=f"Близнец{i + 1}",
            bio=BIO_MATCH_CALIBRATION_ANCHOR,
            gender=GenderEnum.MALE,
            age=24 + (i % 4),
            options=anchor_options,
            photo_paths=photo_paths,
        )

    for i in range(6):
        await add_user_with_traits(
            telegram_id=MATCH_LOW_TELEGRAM_START + i,
            first_name=f"Контраст{i + 1}",
            bio=BIO_MATCH_CALIBRATION_LOW,
            gender=GenderEnum.MALE,
            age=30 + i,
            options=low_options,
            photo_paths=photo_paths,
        )

    logger.info(
        "match_calibration_users_seeded",
        anchor_telegram=MATCH_ANCHOR_TELEGRAM_ID,
        hint="Якорь — женщина. Близнецы — мужчины с тем же био и теми же фильтрами (высокий %). Контраст — мужчины, другое био, почти другие теги (низкий %). В поиске: пол мужской, город Москва.",
    )


def _ordered_pair(user_a: uuid.UUID, user_b: uuid.UUID) -> tuple[uuid.UUID, uuid.UUID]:
    return (user_a, user_b) if user_a < user_b else (user_b, user_a)


async def seed_test_received_likes(session: AsyncSession) -> set[tuple[uuid.UUID, uuid.UUID]]:
    """
    Входящие лайки без метча: другие пользователи лайкают recipient, пара не матчится
  (см. get_received_like_sender_ids).
    """
    user_ids = list((await session.execute(select(User.id).order_by(User.id))).scalars().all())
    if len(user_ids) < 2:
        logger.info("test_likes_skip_few_users", user_count=len(user_ids))
        return set()

    existing_rows = await session.execute(
        select(Like.user_from_id, Like.user_to_id).where(
            Like.like_type.in_((LikeTypeEnum.LIKE, LikeTypeEnum.SUPERLIKE)),
        )
    )
    existing_likes: set[tuple[uuid.UUID, uuid.UUID]] = {
        (row[0], row[1]) for row in existing_rows.all()
    }

    skip_match_pairs: set[tuple[uuid.UUID, uuid.UUID]] = set()
    created = 0
    superlikes_created = 0

    for recipient_id in user_ids:
        candidates = [uid for uid in user_ids if uid != recipient_id]
        random.shuffle(candidates)
        added = 0
        for sender_id in candidates:
            if added >= LIKES_SEED_COUNT_PER_USER:
                break
            if (sender_id, recipient_id) in existing_likes:
                continue
            like_type = LikeTypeEnum.LIKE
            message = None
            if (
                created in SUPERLIKE_SEED_CREATED_INDICES
                and superlikes_created < len(SUPERLIKE_SEED_MESSAGES)
            ):
                like_type = LikeTypeEnum.SUPERLIKE
                message = SUPERLIKE_SEED_MESSAGES[superlikes_created]
                superlikes_created += 1
            session.add(
                Like(
                    user_from_id=sender_id,
                    user_to_id=recipient_id,
                    like_type=like_type,
                    message=message,
                )
            )
            existing_likes.add((sender_id, recipient_id))
            skip_match_pairs.add(_ordered_pair(sender_id, recipient_id))
            created += 1
            added += 1

    if created:
        await session.flush()

    logger.info(
        "test_received_likes_seeded",
        likes_created=created,
        superlikes_created=superlikes_created,
        user_count=len(user_ids),
        per_user_target=LIKES_SEED_COUNT_PER_USER,
    )
    return skip_match_pairs


async def seed_test_matches(
    session: AsyncSession,
    *,
    skip_pairs: set[tuple[uuid.UUID, uuid.UUID]] | None = None,
) -> int:
    """Метч и чат для пар тестовых пользователей (для списка чатов)."""
    skip_pairs = skip_pairs or set()
    user_ids = list((await session.execute(select(User.id).order_by(User.id))).scalars().all())
    if len(user_ids) < 2:
        logger.info("test_matches_skip_few_users", user_count=len(user_ids))
        return 0

    existing_pairs: set[tuple[uuid.UUID, uuid.UUID]] = set()
    rows = await session.execute(select(Match.user1_id, Match.user2_id))
    for user1_id, user2_id in rows.all():
        existing_pairs.add(_ordered_pair(user1_id, user2_id))

    new_matches: list[Match] = []
    for i in range(len(user_ids)):
        for j in range(i + 1, len(user_ids)):
            pair = _ordered_pair(user_ids[i], user_ids[j])
            if pair in existing_pairs or pair in skip_pairs:
                continue
            user1_id, user2_id = pair
            match = Match(user1_id=user1_id, user2_id=user2_id)
            session.add(match)
            new_matches.append(match)

    if not new_matches:
        logger.info("test_matches_already_seeded", user_count=len(user_ids))
        return 0

    await session.flush()

    new_chats: list[Chat] = []
    for match in new_matches:
        chat = Chat(match_id=match.id)
        session.add(chat)
        new_chats.append(chat)
    await session.flush()

    for chat, match in zip(new_chats, new_matches, strict=True):
        session.add(
            Message(
                chat_id=chat.id,
                sender_id=match.user1_id,
                content=fake.sentence(nb_words=6),
            )
        )

    created = len(new_matches)
    logger.info(
        "test_matches_seeded",
        matches_created=created,
        user_count=len(user_ids),
        messages_created=created,
    )
    return created


async def clear_elasticsearch_users_index(es_client: ElasticsearchClient) -> None:
    if not await es_client.index_exists("users"):
        logger.info("elasticsearch_users_index_absent_skip_clear")
        return
    await es_client.delete_index("users")
    logger.info("elasticsearch_users_index_cleared_after_test_db_seed")


async def init_test_db(session: AsyncSession, count: int = 50) -> bool:
    try:
        admin_exists = (await session.execute(select(User))).scalars().first()
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
        test_photo_paths = ensure_test_profile_photos_synced()

        existing_users = await session.scalar(select(func.count()).select_from(User)) or 0
        if existing_users >= count:
            logger.info(
                "init_test_db_skip_user_seed",
                existing_users=existing_users,
                target_count=count,
            )
            await seed_test_matches(session)
            await session.commit()
            return False

        logger.info(f"Starting generation of {count} users...")
        for _ in range(count):
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
                education_details=(
                    random.choice(
                        [
                            "МГУ им. М.В. Ломоносова",
                            "СПбГУ",
                            "МГТУ им. Н.Э. Баумана",
                            "НИУ ВШЭ",
                            "МФТИ",
                            "КФУ",
                            "УрФУ",
                            "ИТМО",
                        ]
                    )
                    if random.random() > 0.35
                    else None
                ),
                subscription_tier=random.choice(list(SubscriptionTierEnum)),
                adequacy_score=round(random.uniform(9.0, 10.0), 1) if is_high_match else round(random.uniform(5.0, 10.0), 1),
                last_seen=datetime.now() - timedelta(minutes=random.randint(0, 120)) if is_high_match else datetime.now() - timedelta(minutes=random.randint(0, 10000)),
                referral_code=f"REF{uuid.uuid4().hex[:12].upper()}",
                notifications_enabled=random.random() > 0.4,
                profile_moderation_approved=True,
                boost_expires_at=datetime.now() + timedelta(hours=2) if is_high_match else (datetime.now() + timedelta(hours=2) if random.random() > 0.9 else None),
                language=random.choice(list(UserLanguageEnum)),
            )
            
            session.add(user)
            await session.flush()

            for order, file_path in enumerate(
                pick_test_photo_paths(test_photo_paths, random.randint(1, 3))
            ):
                session.add(
                    UserPhoto(
                        user_id=user.id,
                        file_path=file_path,
                        order=order,
                        is_main=(order == 0),
                    )
                )

            # Увеличиваем количество характеристик для лучшего matching
            num_traits = random.randint(8, 15) if is_high_match else random.randint(6, 12)
            random_traits = random.sample(all_options, k=min(num_traits, len(all_options)))
            for trait in random_traits:
                user_filter = UserFilterAssociation(
                    user_id=user.id,
                    option_id=trait.id
                )
                session.add(user_filter)
            await session.flush()

        await seed_match_calibration_users(session, photo_paths=test_photo_paths)
        likes_skip_pairs = await seed_test_received_likes(session)
        await seed_test_matches(session, skip_pairs=likes_skip_pairs)

        await session.commit()
        logger.info(f"Successfully seeded {count} users")
        return True

    except Exception as e:
        await session.rollback()
        logger.error(f"Seeding failed: {str(e)}", exc_info=True)
        raise


async def sync_test_users_to_es(
    session: AsyncSession,
    es_client: ElasticsearchClient,
    *,
    container: AsyncContainer,
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

        ml_service = await container.get(MLService)
        user_index_service = UserIndexService(
            user_repository=UserRepository(session=session),
            elasticsearch_client=es_client,
            ml_service=ml_service,
        )

        logger.info("Building Elasticsearch documents from DB user rows")

        es_operations = []

        for i, user in enumerate(users):
            doc_dict = await user_index_service.build_document(
                user.id,
                include_personality_vector=True,
            )
            if doc_dict:
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
    