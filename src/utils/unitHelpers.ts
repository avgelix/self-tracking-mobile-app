export const COMMON_UNITS = {
  liquid: ['ml', 'liters', 'cups', 'glasses', 'bottles', 'fl oz'],
  weight: ['kg', 'lbs', 'grams', 'oz', 'stones'],
  distance: ['km', 'miles', 'meters', 'feet', 'steps'],
  time: ['minutes', 'hours', 'seconds', 'days'],
  quantity: ['pieces', 'items', 'servings', 'times', 'reps'],
  rating: ['/10', '/5', '%', 'stars', '/100'],
  currency: ['$', '€', '£', '¥'],
  energy: ['calories', 'kcal', 'kJ'],
  temperature: ['°C', '°F']
};

export const UNIT_SUGGESTIONS_BY_CATEGORY = {
  'water': ['glasses', 'liters', 'ml', 'cups', 'bottles'],
  'exercise': ['minutes', 'hours', 'reps', 'sets'],
  'mood': ['/10', '/5', 'stars'],
  'weight': ['kg', 'lbs', 'grams'],
  'sleep': ['hours', 'minutes'],
  'food': ['servings', 'calories', 'pieces'],
  'reading': ['pages', 'minutes', 'chapters'],
  'meditation': ['minutes', 'sessions'],
  'steps': ['steps', 'km', 'miles'],
  'money': ['$', '€', '£', 'amount']
};

export function getUnitSuggestions(categoryName: string, categoryType: string): string[] {
  const normalizedName = categoryName.toLowerCase();
  
  // Check for specific category matches
  for (const [key, units] of Object.entries(UNIT_SUGGESTIONS_BY_CATEGORY)) {
    if (normalizedName.includes(key)) {
      return units;
    }
  }
  
  // Fall back to type-based suggestions
  switch (categoryType) {
    case 'number':
      return ['pieces', 'items', 'times', 'glasses', 'servings'];
    case 'duration':
      return ['minutes', 'hours', 'seconds'];
    case 'scale':
      return ['/10', '/5', '%', 'stars'];
    case 'boolean':
      return ['yes/no', 'done', 'completed'];
    default:
      return ['units'];
  }
}

export function formatValueWithUnit(value: number | boolean, unit: string, type: string): string {
  if (type === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (type === 'scale' && unit.startsWith('/')) {
    return `${value}${unit}`;
  }
  
  if (unit.startsWith('$') || unit.startsWith('€') || unit.startsWith('£')) {
    return `${unit}${value}`;
  }
  
  return `${value} ${unit}`;
}