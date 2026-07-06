import { Weight } from '../types';
import { addDays } from './dates';

export type MovingAvgPoint = {
  date: string;
  lbs: number;
  outlierInvolved: boolean;
};

export function movingAvg7(weights: Weight[]): MovingAvgPoint[] {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((current) => {
    const start = addDays(current.date, -6);
    const window = sorted.filter((w) => w.date >= start && w.date <= current.date);
    const sum = window.reduce((acc, w) => acc + w.lbs, 0);
    return {
      date: current.date,
      lbs: Math.round((sum / window.length) * 10) / 10,
      outlierInvolved: window.some((w) => w.flag === 'outlier'),
    };
  });
}