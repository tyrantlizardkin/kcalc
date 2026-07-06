const LBS_TO_KG = 0.45359237;

const MET_TABLE: Record<string, number> = {
  walking: 3.5,
  running: 9.8,
  cycling: 7.5,
  'strength training': 6.0,
  hiking: 6.0,
  swimming: 8.0,
  yoga: 2.5,
  elliptical: 5.0,
};

const DEFAULT_MET = 4.0;

/**
 * kcal = MET * 3.5 * weightKg / 200 * minutes (standard MET-to-kcal/min formula).
 * Used only when Health Connect has no device-reported calorie figure for a session.
 */
export function estimateKcalBurned(activity: string, minutes: number, weightLbs: number, met?: number): number {
  const resolvedMet = met ?? MET_TABLE[activity.trim().toLowerCase()] ?? DEFAULT_MET;
  const weightKg = weightLbs * LBS_TO_KG;
  const kcalPerMinute = (resolvedMet * 3.5 * weightKg) / 200;
  return Math.round(kcalPerMinute * minutes);
}
