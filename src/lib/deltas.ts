import { Weight } from '../types';
import { addDays } from './dates';

export type WeightDeltas = {
  priorDelta: number | null;
  sevenDayDelta: number | null;
  priorDate: string | null;
  sevenDayDate: string | null;
  outlierInvolved: boolean;
};

export function weightDeltas(weights: Weight[], date: string): WeightDeltas | null {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const currentIndex = sorted.findIndex((w) => w.date === date);
  if (currentIndex < 0) return null;
  const current = sorted[currentIndex];
  const prior = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const cutoff = addDays(date, -7);
  const sevenDay = [...sorted].reverse().find((w) => w.date <= cutoff) ?? null;
  return {
    priorDelta: prior ? round1(current.lbs - prior.lbs) : null,
    sevenDayDelta: sevenDay ? round1(current.lbs - sevenDay.lbs) : null,
    priorDate: prior?.date ?? null,
    sevenDayDate: sevenDay?.date ?? null,
    outlierInvolved: [current, prior, sevenDay].some((w) => w?.flag === 'outlier'),
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}