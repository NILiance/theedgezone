/**
 * Curated emoji library for the site builder icon picker.
 * Grouped to keep the picker browsable; biased toward emojis
 * athletes / brands actually use.
 */
export const EMOJI_GROUPS: Array<{ name: string; emojis: string[] }> = [
  {
    name: 'Trophies & medals',
    emojis: ['🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '👑', '💎', '⭐', '🌟', '✨', '⚡'],
  },
  {
    name: 'Sports',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🪀',
      '🏓', '🏸', '🥅', '⛳', '🏒', '🏑', '🥍', '🏏', '🥊', '🥋',
      '⛸️', '🎿', '⛷️', '🏂', '🏄', '🏊', '🚴', '🏇', '🤸', '🤾',
      '🤺', '🤼', '🤽', '🤹', '🏋️', '🚣', '🧗', '🤾‍♀️', '🥏', '🛹',
    ],
  },
  {
    name: 'Stats & data',
    emojis: ['📈', '📉', '📊', '🔢', '💯', '🎯', '📌', '🚀', '🔥', '💥', '⚡', '🥇'],
  },
  {
    name: 'Money & deals',
    emojis: ['💰', '💵', '💸', '🪙', '🏦', '💳', '📈', '🤝', '✍️', '📝', '📃', '🧾'],
  },
  {
    name: 'Social & followers',
    emojis: ['👥', '👤', '🤳', '📱', '💬', '🗣️', '📣', '📢', '❤️', '👍', '👏', '🎉'],
  },
  {
    name: 'Education & school',
    emojis: ['🎓', '📚', '📖', '✏️', '🖊️', '🎒', '🏫', '🧑‍🎓', '🧑‍🏫', '📐', '🧪', '🔬'],
  },
  {
    name: 'Time & schedule',
    emojis: ['⏱️', '⏰', '📅', '📆', '🗓️', '🕐', '⏳', '⌛', '🌅', '🌇', '🌙', '☀️'],
  },
  {
    name: 'Travel & places',
    emojis: ['✈️', '🚗', '🏟️', '🏟', '🌎', '🌍', '🗺️', '📍', '🏠', '🏖️', '⛰️', '🏝️'],
  },
  {
    name: 'Other',
    emojis: [
      '🎵', '🎤', '🎧', '🎬', '📸', '🎥', '🎮', '🎨', '🖼️', '🎭',
      '🍔', '🍕', '☕', '💧', '🧃', '🩺', '💊', '🧘', '🏥', '🧠',
      '❤️‍🔥', '💪', '🙌', '✌️', '🤙', '🙏', '👊', '🫶', '🫡', '😎',
    ],
  },
]

export const ALL_EMOJIS = EMOJI_GROUPS.flatMap((g) => g.emojis)

/**
 * Icon picker values are stored as discriminated strings:
 *   ''                      → none
 *   'emoji:🏆'              → emoji
 *   'image:https://…'       → image
 *
 * Legacy values without a prefix are interpreted as emoji for backward
 * compatibility with existing stats / achievements blocks.
 */
export type IconValue =
  | { kind: 'none' }
  | { kind: 'emoji'; value: string }
  | { kind: 'image'; value: string }

export function parseIcon(raw: unknown): IconValue {
  if (typeof raw !== 'string' || raw.length === 0) return { kind: 'none' }
  if (raw.startsWith('emoji:')) return { kind: 'emoji', value: raw.slice(6) }
  if (raw.startsWith('image:')) return { kind: 'image', value: raw.slice(6) }
  // Legacy: treat any other non-empty string as emoji.
  return { kind: 'emoji', value: raw }
}

export function serializeIcon(value: IconValue): string {
  // Keep the prefix even when value is empty so the picker remembers
  // the user's mode while they're still entering a URL / emoji.
  switch (value.kind) {
    case 'none':
      return ''
    case 'emoji':
      return `emoji:${value.value}`
    case 'image':
      return `image:${value.value}`
  }
}
