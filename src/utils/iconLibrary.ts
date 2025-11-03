export const ICON_CATEGORIES = {
  health: ['💧', '🏃‍♂️', '🧘‍♀️', '💊', '🩺', '🏥', '🦷', '👁️', '🧠', '❤️', '🫁', '🍎', '🥗', '🥛', '💤', '🛏️', '⚖️'],
  fitness: ['🏋️‍♀️', '🚴‍♂️', '🏊‍♀️', '⚽', '🏀', '🎾', '🏓', '🥊', '🤸‍♀️', '🧗‍♀️', '⛹️‍♀️', '🏌️‍♀️', '🚶‍♀️', '🏃‍♀️'],
  emotions: ['😊', '😔', '😡', '😰', '😌', '🤗', '😍', '🥰', '😤', '😪', '🙂', '😎', '🤔', '😲', '😇', '🥺'],
  productivity: ['📚', '📝', '💻', '📱', '⏰', '📅', '🎯', '✅', '📊', '📈', '💼', '🏢', '✏️', '📋', '📖', '🔍'],
  lifestyle: ['☕', '🍽️', '🛒', '🚗', '🏠', '🎵', '📺', '🎮', '🎨', '📷', '🎬', '🎭', '🎪', '🎊', '🎁', '🛍️'],
  nature: ['🌱', '🌸', '🌳', '🌞', '🌙', '⭐', '🌈', '🔥', '💨', '🌊', '⛰️', '🏔️', '🏖️', '🌺', '🍃', '🌿'],
  food: ['🍎', '🥕', '🥬', '🍌', '🍇', '🍓', '🥑', '🥒', '🍅', '🌶️', '🧄', '🧅', '🥔', '🍞', '🥖', '🧀'],
  travel: ['✈️', '🚗', '🚕', '🚌', '🚲', '🛴', '⛵', '🚢', '🗺️', '🧳', '📍', '🏨', '🎒', '🏛️', '🏰', '🗽'],
  money: ['💰', '💳', '💎', '🏦', '📊', '📈', '💸', '🪙', '💵', '💴', '💶', '💷', '💹', '🧾', '🏪', '🛒'],
  social: ['👥', '👨‍👩‍👧‍👦', '👫', '👬', '👭', '🗣️', '💬', '📞', '📱', '💌', '❤️', '💕', '🎉', '🎊', '👏', '🤝'],
  misc: ['⭐', '🔮', '🎲', '🎯', '🔔', '⚡', '🔥', '💫', '✨', '🌟', '💥', '🎪', '🎨', '🧩', '🔧', '⚙️']
};

export const ALL_ICONS = Object.values(ICON_CATEGORIES).flat();

export const COLOR_PALETTE = {
  blues: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a', '#60a5fa', '#93c5fd', '#dbeafe', '#06b6d4', '#0891b2', '#0e7490'],
  greens: ['#10b981', '#059669', '#047857', '#065f46', '#34d399', '#6ee7b7', '#a7f3d0', '#22c55e', '#16a34a', '#15803d'],
  yellows: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#fbbf24', '#fcd34d', '#fde68a', '#eab308', '#ca8a04', '#a16207'],
  reds: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#f87171', '#fca5a5', '#fecaca', '#f43f5e', '#e11d48', '#be123c'],
  purples: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#a855f7', '#9333ea', '#7e22ce'],
  pinks: ['#ec4899', '#db2777', '#be185d', '#9d174d', '#f472b6', '#f9a8d4', '#fce7f3', '#d946ef', '#c026d3', '#a21caf'],
  grays: ['#6b7280', '#4b5563', '#374151', '#1f2937', '#9ca3af', '#d1d5db', '#e5e7eb', '#64748b', '#475569', '#334155'],
  oranges: ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#fb923c', '#fdba74', '#fed7aa', '#ff6b35', '#e55100', '#bf360c'],
  teals: ['#14b8a6', '#0d9488', '#0f766e', '#115e59', '#2dd4bf', '#5eead4', '#99f6e4', '#06b6d4', '#0891b2', '#0e7490'],
  indigos: ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#818cf8', '#a5b4fc', '#c7d2fe', '#8b5cf6', '#7c3aed', '#6d28d9']
};

export const ALL_COLORS = Object.values(COLOR_PALETTE).flat();

export const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Gray', value: '#6b7280' }
];

export function getIconsByCategory(category: string): string[] {
  return ICON_CATEGORIES[category as keyof typeof ICON_CATEGORIES] || [];
}

export function getColorsByCategory(category: string): string[] {
  return COLOR_PALETTE[category as keyof typeof COLOR_PALETTE] || [];
}