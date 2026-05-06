// Константы, общие для фичи matches-feed.
// Здесь храним дизайн‑токены и настройки анимаций,
// чтобы переиспользовать их в разных компонентах.

// --- Оверлей профиля (matches overlay) ---

export const MATCHES_OVERLAY_EASE_OUT = [0.25, 0.46, 0.45, 0.94] as const
export const MATCHES_OVERLAY_EXIT_DURATION = 0.5
export const MATCHES_OVERLAY_EASE_ENTER = [0.22, 0.61, 0.36, 1] as const
export const MATCHES_OVERLAY_ENTER_DURATION = 0.28
export const MATCHES_OVERLAY_INITIAL_ENTER_Y = 40
export const MATCHES_OVERLAY_INITIAL_ENTER_SCALE = 0.96
export const MATCHES_OVERLAY_INITIAL_EXIT_Y = 36

// Spring-анимация при отпускании драга и клике по индикатору
export const MATCHES_OVERLAY_SPRING_EXPAND = { stiffness: 350, damping: 35 } as const
export const MATCHES_OVERLAY_SPRING_INDICATOR = { stiffness: 300, damping: 30 } as const
export const MATCHES_OVERLAY_DRAG_VELOCITY_THRESHOLD = -500

// Коэффициенты для useTransform (доля от dragLimit)
export const MATCHES_OVERLAY_TRANSFORM_CAROUSEL_OPACITY_END = 1 / 3
export const MATCHES_OVERLAY_TRANSFORM_PILL_OPACITY_START = 0.7
export const MATCHES_OVERLAY_TRANSFORM_CARD_MARGIN_END = 1 / 5

// Радиус контейнера оверлея (развёрнутое состояние)
export const MATCHES_OVERLAY_CONTAINER_RADIUS = 40
export const MATCHES_OVERLAY_CONTENT_AREA_DEFAULT_HEIGHT = 600

// Соотношение высот в оверлее: карусель 40% / карточка с информацией 60% контент-области
export const MATCHES_OVERLAY_CAROUSEL_HEIGHT_RATIO = 0.4
export const MATCHES_OVERLAY_CAROUSEL_CARD_GAP_PX = 12

// Отступы оверлея: сверху — padding корня, снизу — резерв в контенте (одинаково на всех экранах, в т.ч. SE)
export const MATCHES_OVERLAY_PADDING_VERTICAL_PX = 16
export const MATCHES_OVERLAY_PADDING_HORIZONTAL_PX = 16
/** Резерв снизу внутри контент-области, чтобы всегда было ровно 16px отступа на SE и iOS */
export const MATCHES_OVERLAY_BOTTOM_RESERVE_PX = 16

/** Доп. отступ сверху у блока с мэтчем в развёрнутом оверлее (согласован с высотой контейнера и dragLimit) */
export const MATCHES_OVERLAY_EXPANDED_TOP_PADDING_PX = 95

// Плашка‑пилюля с мэтчем
export const MATCHES_OVERLAY_PILL_HEIGHT = 42
export const MATCHES_OVERLAY_PILL_WIDTH = 190
export const MATCHES_OVERLAY_PILL_TOP_MARGIN = 12

// --- Белая карточка с индикатором (SheetCard) ---
export const SHEET_CARD_RADIUS_PX = 48
export const SHEET_CARD_SHADOW = ''
