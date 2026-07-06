import { daySummary } from '../src/lib/netCalc';
import { weightDeltas } from '../src/lib/deltas';
import { movingAvg7 } from '../src/lib/movingAvg';
import { dayFlags } from '../src/lib/flags';
import { Meal, Weight } from '../src/types';

test('daySummary nets exercise against target', () => {
  expect(daySummary(1600, 250, 1500)).toEqual({
    eatenKcal: 1600,
    exerciseKcal: 250,
    netKcal: 1350,
    remainingKcal: 150,
    targetKcal: 1500,
    progress: 0.9,
  });
});

test('weightDeltas uses most recent prior entry and date <= 7 days ago', () => {
  const weights: Weight[] = [
    { id: 1, date: '2026-06-25', lbs: 340, flag: null, createdAt: 1 },
    { id: 2, date: '2026-06-28', lbs: 338, flag: null, createdAt: 2 },
    { id: 3, date: '2026-07-04', lbs: 337, flag: null, createdAt: 3 },
    { id: 4, date: '2026-07-05', lbs: 336.4, flag: 'outlier', createdAt: 4 },
  ];
  expect(weightDeltas(weights, '2026-07-05')).toEqual({
    priorDelta: -0.6,
    sevenDayDelta: -1.6,
    priorDate: '2026-07-04',
    sevenDayDate: '2026-06-28',
    outlierInvolved: true,
  });
});

test('movingAvg7 includes outliers and annotates windows', () => {
  const weights: Weight[] = [
    { id: 1, date: '2026-07-01', lbs: 100, flag: null, createdAt: 1 },
    { id: 2, date: '2026-07-02', lbs: 110, flag: 'outlier', createdAt: 2 },
    { id: 3, date: '2026-07-08', lbs: 120, flag: null, createdAt: 3 },
  ];
  expect(movingAvg7(weights)).toEqual([
    { date: '2026-07-01', lbs: 100, outlierInvolved: false },
    { date: '2026-07-02', lbs: 105, outlierInvolved: true },
    { date: '2026-07-08', lbs: 115, outlierInvolved: true },
  ]);
});

test('dayFlags returns known flags in display order', () => {
  const meals = [
    { flags: ['processed', 'gluten'] },
    { flags: ['casein'] },
  ] as Meal[];
  expect(dayFlags(meals)).toEqual(['gluten', 'casein', 'processed']);
});