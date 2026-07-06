import { Meal } from '../types';

const FLAG_ORDER = ['gluten', 'casein', 'additives', 'high sugar', 'processed'];

export function dayFlags(meals: Meal[]): string[] {
  const found = new Set(meals.flatMap((meal) => meal.flags));
  return FLAG_ORDER.filter((flag) => found.has(flag));
}