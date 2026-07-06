import { dedupeRecords, toNewExercise, HcExerciseRecord } from '../src/lib/hcSync';

test('toNewExercise maps a Health Connect record to a NewExercise row', () => {
  const record: HcExerciseRecord = { recordId: 'hc-1', date: '2026-07-05', activity: 'running', kcalBurned: 310 };
  expect(toNewExercise(record)).toEqual({
    date: '2026-07-05',
    activity: 'running',
    kcalBurned: 310,
    source: 'healthconnect',
    hcRecordId: 'hc-1',
  });
});

test('dedupeRecords collapses repeated recordIds, keeping the higher kcal figure', () => {
  const records: HcExerciseRecord[] = [
    { recordId: 'hc-1', date: '2026-07-05', activity: 'ride', kcalBurned: 300 },
    { recordId: 'hc-1', date: '2026-07-05', activity: 'ride', kcalBurned: 320 },
    { recordId: 'hc-2', date: '2026-07-05', activity: 'walk', kcalBurned: 90 },
  ];
  const result = dedupeRecords(records);
  expect(result).toHaveLength(2);
  expect(result.find((r) => r.recordId === 'hc-1')?.kcalBurned).toBe(320);
  expect(result.find((r) => r.recordId === 'hc-2')?.kcalBurned).toBe(90);
});

test('dedupeRecords is a no-op when all recordIds are unique', () => {
  const records: HcExerciseRecord[] = [
    { recordId: 'hc-1', date: '2026-07-05', activity: 'ride', kcalBurned: 300 },
    { recordId: 'hc-2', date: '2026-07-05', activity: 'walk', kcalBurned: 90 },
  ];
  expect(dedupeRecords(records)).toHaveLength(2);
});
