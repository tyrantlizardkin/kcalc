import { SqlDb } from './sqlDb';
import { Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  kcalTarget: 1500,
  proteinTargetG: 150,
  carbsTargetG: 110,
  fatTargetG: 50,
  heightCm: 200,
  age: 42,
  sex: 'male',
  lastHcSyncMs: 0,
};

export function makeSettingsRepo(db: SqlDb) {
  return {
    async getAll(): Promise<Settings> {
      const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
      const stored = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)])) as Partial<Settings>;
      return { ...DEFAULT_SETTINGS, ...stored };
    },
    async set(patch: Partial<Settings>): Promise<void> {
      await Promise.all(
        Object.entries(patch).map(([key, value]) =>
          db.runAsync(
            `INSERT INTO settings (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
            key,
            JSON.stringify(value)
          )
        )
      );
    },
  };
}

export type SettingsRepo = ReturnType<typeof makeSettingsRepo>;