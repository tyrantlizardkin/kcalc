import { Weight } from '../types';
import { movingAvg7 } from './movingAvg';

export type ChartPoint = { x: number; y: number };

export type WeightChartData = {
  linePoints: ChartPoint[];
  maPoints: ChartPoint[];
  minLbs: number;
  maxLbs: number;
};

export function buildWeightChartData(
  weights: Weight[],
  width: number,
  height: number,
  padding = 20
): WeightChartData {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return { linePoints: [], maPoints: [], minLbs: 0, maxLbs: 0 };
  }

  const ma = movingAvg7(sorted);
  const allLbs = [...sorted.map((w) => w.lbs), ...ma.map((m) => m.lbs)];
  let minLbs = Math.min(...allLbs);
  let maxLbs = Math.max(...allLbs);
  if (minLbs === maxLbs) {
    maxLbs = minLbs + 1;
  }

  const innerW = width - 2 * padding;
  const innerH = height - 2 * padding;
  const range = maxLbs - minLbs;
  const xAt = (i: number): number => (sorted.length === 1 ? width / 2 : padding + (i / (sorted.length - 1)) * innerW);
  const yAt = (lbs: number): number => padding + ((maxLbs - lbs) / range) * innerH;

  return {
    linePoints: sorted.map((entry, i) => ({ x: xAt(i), y: yAt(entry.lbs) })),
    maPoints: ma.map((entry, i) => ({ x: xAt(i), y: yAt(entry.lbs) })),
    minLbs,
    maxLbs,
  };
}

export function toSvgPath(points: ChartPoint[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  const start = `M ${first.x} ${first.y}`;
  if (rest.length === 0) return start;
  return `${start} ${rest.map((p) => `L ${p.x} ${p.y}`).join(' ')}`;
}
