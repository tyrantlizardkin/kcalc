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
