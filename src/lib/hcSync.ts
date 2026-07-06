import { NewExercise } from '../types';

export type HcExerciseRecord = {
  recordId: string;
  date: string;
  activity: string;
  kcalBurned: number;
};

export function dedupeRecords(records: HcExerciseRecord[]): HcExerciseRecord[] {
  const byId = new Map<string, HcExerciseRecord>();
  for (const record of records) {
    const existing = byId.get(record.recordId);
    if (!existing || record.kcalBurned > existing.kcalBurned) {
      byId.set(record.recordId, record);
    }
  }
  return [...byId.values()];
}

export function toNewExercise(record: HcExerciseRecord): NewExercise {
  return {
    date: record.date,
    activity: record.activity,
    kcalBurned: record.kcalBurned,
    source: 'healthconnect',
    hcRecordId: record.recordId,
  };
}
