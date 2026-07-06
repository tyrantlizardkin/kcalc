import { Repos } from '../db';
import { SqlDb } from '../db/sqlDb';
import { ExerciseEntry, ExerciseSource, Meal, MealSource, Settings, SflItem, Weight } from '../types';

export type BackupDump = {
  version: 1;
  exportedAt: number;
  weights: Weight[];
  meals: Meal[];
  exercise: ExerciseEntry[];
  sfl: SflItem[];
  settings: Settings;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MEAL_SOURCES: MealSource[] = ['photo', 'chat', 'manual', 'sfl'];
const EXERCISE_SOURCES: ExerciseSource[] = ['healthconnect', 'chat', 'manual'];

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
  assertBackupDump(dump);
  await db.execAsync('BEGIN IMMEDIATE TRANSACTION');
  try {
    await db.execAsync(
      'DELETE FROM weights; DELETE FROM meals; DELETE FROM exercise; DELETE FROM sfl; DELETE FROM chat_messages; DELETE FROM settings;'
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
    await db.execAsync('COMMIT');
  } catch (error) {
    try {
      await db.execAsync('ROLLBACK');
    } catch {
      // Keep the original restore error. A rollback failure is secondary.
    }
    throw error;
  }
}

function assertBackupDump(value: unknown): asserts value is BackupDump {
  if (!isRecord(value)) throw new Error('Invalid backup dump');
  if (value.version !== 1) throw new Error('Unsupported backup version');
  if (!isNumber(value.exportedAt)) throw new Error('Invalid backup exportedAt');
  if (!Array.isArray(value.weights) || !value.weights.every(isWeight)) throw new Error('Invalid backup weights');
  if (!Array.isArray(value.meals) || !value.meals.every(isMeal)) throw new Error('Invalid backup meals');
  if (!Array.isArray(value.exercise) || !value.exercise.every(isExercise)) throw new Error('Invalid backup exercise');
  if (!Array.isArray(value.sfl) || !value.sfl.every(isSflItem)) throw new Error('Invalid backup sfl');
  if (!isSettings(value.settings)) throw new Error('Invalid backup settings');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isDate(value: unknown): value is string {
  return typeof value === 'string' && DATE_RE.test(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isWeight(value: unknown): value is Weight {
  if (!isRecord(value)) return false;
  return isNumber(value.id) && isDate(value.date) && isNumber(value.lbs) && isNullableString(value.flag) && isNumber(value.createdAt);
}

function isMeal(value: unknown): value is Meal {
  if (!isRecord(value)) return false;
  return (
    isNumber(value.id) &&
    isDate(value.date) &&
    typeof value.name === 'string' &&
    typeof value.detail === 'string' &&
    isNumber(value.kcal) &&
    isNumber(value.proteinG) &&
    isNumber(value.carbsG) &&
    isNumber(value.fatG) &&
    isStringArray(value.flags) &&
    typeof value.source === 'string' &&
    MEAL_SOURCES.includes(value.source as MealSource) &&
    isNullableString(value.photoUri) &&
    isNumber(value.createdAt)
  );
}

function isExercise(value: unknown): value is ExerciseEntry {
  if (!isRecord(value)) return false;
  return (
    isNumber(value.id) &&
    isDate(value.date) &&
    typeof value.activity === 'string' &&
    isNumber(value.kcalBurned) &&
    typeof value.source === 'string' &&
    EXERCISE_SOURCES.includes(value.source as ExerciseSource) &&
    isNullableString(value.hcRecordId) &&
    isNumber(value.createdAt)
  );
}

function isSflItem(value: unknown): value is SflItem {
  if (!isRecord(value)) return false;
  return (
    isNumber(value.id) &&
    typeof value.name === 'string' &&
    typeof value.serving === 'string' &&
    isNumber(value.kcal) &&
    isNumber(value.proteinG) &&
    isNumber(value.carbsG) &&
    isNumber(value.fatG) &&
    isStringArray(value.flags)
  );
}

function isSettings(value: unknown): value is Settings {
  if (!isRecord(value)) return false;
  return (
    isNumber(value.kcalTarget) &&
    isNumber(value.proteinTargetG) &&
    isNumber(value.carbsTargetG) &&
    isNumber(value.fatTargetG) &&
    isNumber(value.heightCm) &&
    isNumber(value.age) &&
    (value.sex === 'male' || value.sex === 'female') &&
    isNumber(value.lastHcSyncMs) &&
    isNullableString(value.lastBackupHash) &&
    (value.lastBackupAt === null || isNumber(value.lastBackupAt))
  );
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
  // Exclude mutable bookkeeping fields from settings so writing them back
  // (e.g. after every HC sync or every backup upload) doesn't perturb the
  // hash and defeat the backupIfChanged short-circuit.
  const { lastHcSyncMs: _lastHcSyncMs, lastBackupHash: _lastBackupHash, lastBackupAt: _lastBackupAt, ...stableSettings } =
    stable.settings;
  return hashImpl(stableStringify({ ...stable, settings: stableSettings }));
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
