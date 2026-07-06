import { initialize, requestPermission, readRecords } from 'react-native-health-connect';
import { Repos } from '../db';
import { HcExerciseRecord, dedupeRecords, toNewExercise } from '../lib/hcSync';
import { estimateKcalBurned } from '../lib/metCalc';

const PERMISSIONS = [
  { accessType: 'read' as const, recordType: 'ExerciseSession' as const },
  { accessType: 'read' as const, recordType: 'ActiveCaloriesBurned' as const },
];

export async function requestHealthPermissions(): Promise<boolean> {
  const initialized = await initialize();
  if (!initialized) return false;
  const granted = await requestPermission(PERMISSIONS);
  return granted.length === PERMISSIONS.length;
}

async function readExerciseSince(sinceMs: number, fallbackWeightLbs: number): Promise<HcExerciseRecord[]> {
  const timeRangeFilter = { operator: 'after' as const, startTime: new Date(sinceMs).toISOString() };
  const [{ records: sessions }, { records: calories }] = await Promise.all([
    readRecords('ExerciseSession', { timeRangeFilter }),
    readRecords('ActiveCaloriesBurned', { timeRangeFilter }),
  ]);

  return sessions.map((session) => {
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    const matchedCalories = calories.filter((c) => {
      const calorieStart = new Date(c.startTime).getTime();
      return calorieStart >= start && calorieStart < end;
    });
    const activity = String(session.exerciseType ?? 'exercise');
    const minutes = Math.max(1, Math.round((end - start) / 60000));
    const summedKcal = matchedCalories.reduce((sum, c) => sum + (c.energy?.inKilocalories ?? 0), 0);
    const kcalBurned = matchedCalories.length > 0
      ? Math.round(summedKcal)
      : estimateKcalBurned(activity, minutes, fallbackWeightLbs);

    return {
      recordId: session.metadata?.id ?? `${session.startTime}-${activity}`,
      date: session.startTime.slice(0, 10),
      activity,
      kcalBurned,
    };
  });
}

export async function syncExercise(repos: Repos, sinceMs?: number): Promise<{ inserted: number; updated: number }> {
  const settings = await repos.settings.getAll();
  const since = sinceMs ?? settings.lastHcSyncMs;
  const latestWeight = await repos.weights.latest();
  const raw = await readExerciseSince(since, latestWeight?.lbs ?? 154);
  const deduped = dedupeRecords(raw);

  let inserted = 0;
  let updated = 0;
  for (const record of deduped) {
    const existing = await repos.exercise.byHcRecordId(record.recordId);
    await repos.exercise.insert(toNewExercise(record));
    if (existing) updated += 1;
    else inserted += 1;
  }

  await repos.settings.set({ lastHcSyncMs: Date.now() });
  return { inserted, updated };
}
