import { Repos } from '../db';
import { SqlDb } from '../db/sqlDb';
import { ExerciseEntry, Meal, Settings, SflItem, Weight } from '../types';

export type BackupDump = {
  version: 1;
  exportedAt: number;
  weights: Weight[];
  meals: Meal[];
  exercise: ExerciseEntry[];
  sfl: SflItem[];
  settings: Settings;
};

export async function dumpAll(repos: Repos): Promise<BackupDump> {
  const [weights, meals, exercise, sfl, settings] = await Promise.all([
    repos.weights.all(),
    repos.meals.all(),
    repos.exercise.all(),
    repos.sfl.all(),
    repos.settings.getAll(),
  ]);
  return { version: 1, exportedAt: Date.now(), weights, meals, exercise, sfl, settings };
}

export async function restoreDump(dump: BackupDump, repos: Repos, db: SqlDb): Promise<void> {
  await db.execAsync(
    'DELETE FROM weights; DELETE FROM meals; DELETE FROM exercise; DELETE FROM sfl; DELETE FROM chat_messages;'
  );

  for (const w of dump.weights) {
    await repos.weights.upsert(w.date, w.lbs, w.flag);
  }
  for (const m of dump.meals) {
    await repos.meals.insert({
      date: m.date,
      name: m.name,
      detail: m.detail,
      kcal: m.kcal,
      proteinG: m.proteinG,
      carbsG: m.carbsG,
      fatG: m.fatG,
      flags: m.flags,
      source: m.source,
      photoUri: m.photoUri,
    });
  }
  for (const e of dump.exercise) {
    await repos.exercise.insert({
      date: e.date,
      activity: e.activity,
      kcalBurned: e.kcalBurned,
      source: e.source,
      hcRecordId: e.hcRecordId,
    });
  }
  for (const s of dump.sfl) {
    await repos.sfl.upsert({
      name: s.name,
      serving: s.serving,
      kcal: s.kcal,
      proteinG: s.proteinG,
      carbsG: s.carbsG,
      fatG: s.fatG,
      flags: s.flags,
    });
  }
  await repos.settings.set(dump.settings);
}

async function defaultHashImpl(input: string): Promise<string> {
  const Crypto = await import('expo-crypto');
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

export async function hashDump(
  dump: BackupDump,
  hashImpl: (input: string) => Promise<string> = defaultHashImpl
): Promise<string> {
  const { exportedAt: _exportedAt, ...stable } = dump;
  return hashImpl(stableStringify(stable));
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}
