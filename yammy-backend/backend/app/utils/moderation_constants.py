# Фразы для модерации текста. Из них извлекаются ключевые слова (токены от 3 символов).
# Только однозначные маркеры нарушений. Без общих слов: фото, услуги, платно, встреча,
# досуг, развлечения, деньги, помощь, продам/куплю/обмен без контекста, акция, распродажа.
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
    "spam": "обнаружены признаки рекламы или спама"
}

IMAGE_MODERATION_CATEGORIES = {
    "nsfw": [
        "safe appropriate photo, normal content, regular picture, clothed person",
        "nsfw explicit photo, nude naked person, pornographic sexual content, nudity"
    ],
    "weapons": [
        "safe photo without weapons, peaceful picture, normal content",
        "photo with weapons, gun, firearm, pistol, rifle, knife, dangerous weapon"
    ],
    "drugs": [
        "photo without drugs, normal content, safe picture",
        "photo with drugs, narcotics, pills, cannabis, marijuana, illegal substances, smoking drugs"
    ],
    "violence": [
        "peaceful safe photo, normal content, calm picture",
        "violent photo, blood, gore, injury, fighting, abuse, attack, violence"
    ],
    "hate": [
        "normal photo, appropriate content, safe picture",
        "photo with hate symbols, nazi symbols, swastika, extremism, offensive symbols, hate speech"
    ]
}

IMAGE_MODERATION_ERROR_MESSAGES = {
    "nsfw": "обнаружен NSFW",
    "weapons": "обнаружено оружие",
    "drugs": "обнаружены наркотики",
    "violence": "обнаружено насилие",
    "hate": "обнаружены символы ненависти"
}

TEXT_SIMILARITY_MIN = 0.35
TEXT_SIMILARITY_MAX = 0.65
