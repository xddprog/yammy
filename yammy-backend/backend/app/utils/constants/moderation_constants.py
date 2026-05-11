TEXT_MODERATION_PATTERNS = {
    "scam": [
        "переведи на карту срочно",
        "перевод денег на карту",
        "инвестируй получи прибыль",
        "гарантированный доход без усилий",
        "пассивный доход без риска",
        "финансовая пирамида MLM",
        "заработать быстро без вложений",
        "make money fast guaranteed",
        "investment opportunity high returns",
        "passive income investment",
        "financial pyramid MLM scheme",
    ],
    "crypto": [
        "криптовалюта биткоин эфириум",
        "торговля биткоинами крипта",
        "майнинг крипты доход",
        "крипто трейдинг сигналы",
        "NFT токен крипта",
        "cryptocurrency bitcoin trading",
        "bitcoin ethereum investment",
        "crypto trading signals",
        "crypto mining pool",
    ],
    "drugs": [
        "продам куплю траву план скорость",
        "закладки вещества соль гашиш",
        "наркотики кокс спиды марихуана",
        "барыга дилер закладки",
        "drugs weed cocaine heroin",
        "buy sell marijuana cannabis",
        "pills powder substance delivery",
        "dealer stash drug delivery",
    ],
    "escort": [
        "проститутка эскорт выезд",
        "интим выезд платно",
        "продам голые обнаженные",
        "продаю ню сисек обнаженные",
        "обнаженка сиськи продажа",
        "голая фотосессия продам",
        "эротические обнаженные продам",
        "продам в лс голые личку",
        "пишите в лс сисек обнаженка",
        "дм лс интим обнаженка",
        "пиши лс голые обнаженные",
        "продаю голые фотки",
        "ню фотосет продам",
        "куплю интимные обнаженные",
        "escort services paid intimacy",
        "prostitution paid sex massage",
        "escort companionship intimate",
        "sell nude photos videos",
        "selling nude pictures",
        "buy nude content",
        "selling nudes boobs",
        "nude photoshoot sale",
        "dm me for nudes",
        "message me nude content",
    ],
    "spam": [
        "подписывайся переходи по ссылке",
        "переходи по ссылке регистрируйся",
        "реферальная ссылка регистрируйся",
        "промокод на регистрацию бонус",
        "click link register now",
        "promo code register link",
        "subscribe link in bio",
    ],
}

TEXT_MODERATION_ERROR_MESSAGES = {
    "scam": "обнаружены признаки мошенничества или финансовых схем",
    "crypto": "обнаружены упоминания криптовалют или инвестиций",
    "drugs": "обнаружены упоминания наркотических веществ",
    "escort": "обнаружены упоминания интим-услуг",
    "spam": "обнаружены признаки рекламы или спама",
}

IMAGE_MODERATION_SAFE_ANCHOR = (
    "fully clothed person in everyday or sports context, dating app profile photo, "
    "soccer player in team kit celebrating on a pitch, family photo, portrait at work, "
    "night city skyline with lit hotel tower and traffic lights, cyclist silhouette on sidewalk, "
    "appropriate public content, no pornography no weapons no drugs no gore no hate symbols"
)

IMAGE_MODERATION_FLAGS: list[tuple[str, str]] = [
    (
        "nsfw",
        "hardcore pornography with visible genitals or explicit sex act in frame",
    ),
    (
        "nsfw",
        "completely naked adult with uncovered breasts and genitals porn shoot",
    ),
    (
        "nsfw",
        "close-up photograph whose main subject is uncovered female nipples or genitals",
    ),
    ("weapons", "clear close photograph of metal handgun or revolver in someones hand"),
    (
        "weapons",
        "identifiable shotgun or rifle receiver and barrel held as a weapon not building spire",
    ),
    (
        "weapons",
        "person clearly holding pistol or rifle with trigger guard and barrel visible",
    ),
    ("weapons", "large combat knife or machete brandished as a weapon not kitchen use"),
    ("drugs", "syringe injecting illegal drugs or obvious heroin spoon and needle"),
    ("drugs", "marijuana buds baggie of weed with drug dealing paraphernalia"),
    ("drugs", "white powder lines on mirror with rolled banknote cocaine scene"),
    ("drugs", "pile of recreational pills with drug slang packaging street deal"),
    ("violence", "graphic open wound with severe blood and visible tissue injury"),
    ("violence", "person being beaten with visible blood spray on face"),
    ("violence", "dead body or extreme gore intended to shock viewer"),
    ("hate", "large nazi swastika or SS bolts worn as proud hate symbol in photo"),
    ("hate", "Ku Klux Klan hood or white supremacist rally salute as main subject"),
]

IMAGE_CLIP_LOGIT_SCALE: float = 100.0

IMAGE_CLIP_PAIR_LOGIT_MARGIN: float = 3.4

IMAGE_MODERATION_CLIP_THRESHOLD: float = 0.52

IMAGE_MODERATION_ERROR_MESSAGES = {
    "nsfw": "обнаружен NSFW",
    "weapons": "обнаружено оружие",
    "drugs": "обнаружены наркотики",
    "violence": "обнаружено насилие",
    "hate": "обнаружены символы ненависти",
}

TEXT_SIMILARITY_MIN = 0.35
TEXT_SIMILARITY_MAX = 0.65
