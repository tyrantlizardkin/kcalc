import { createHash } from 'crypto';
import { stableStringify, hashDump, BackupDump, dumpAll, restoreDump } from '../src/lib/backup';
import { makeTestDb } from './helpers/testDb';
import { migrate } from '../src/db/schema';
import { makeWeightsRepo } from '../src/db/weightsRepo';
import { makeMealsRepo } from '../src/db/mealsRepo';
import { makeExerciseRepo } from '../src/db/exerciseRepo';
import { makeSflRepo } from '../src/db/sflRepo';
import { makeSettingsRepo } from '../src/db/settingsRepo';

async function makeTestRepos() {
  const db = makeTestDb();
  await migrate(db);
  return {
    weights: makeWeightsRepo(db),
    meals: makeMealsRepo(db),
    exercise: makeExerciseRepo(db),
    sfl: makeSflRepo(db),
    settings: makeSettingsRepo(db),
    chat: { add: async () => 0, listByDate: async () => [] },
  };
}

test('stableStringify produces identical output regardless of key insertion order', () => {
  const a = { b: 2, a: 1, nested: { y: 1, x: 2 } };
  const b = { a: 1, nested: { x: 2, y: 1 }, b: 2 };
  expect(stableStringify(a)).toBe(stableStringify(b));
});

test('stableStringify preserves array order', () => {
  expect(stableStringify({ items: [3, 1, 2] })).toBe('{"items":[3,1,2]}');
});

test('stableStringify sorts keys of objects nested inside arrays', () => {
  const a = { items: [{ b: 1, a: 2 }, { d: 4, c: 3 }] };
  const b = { items: [{ a: 2, b: 1 }, { c: 3, d: 4 }] };
  expect(stableStringify(a)).toBe(stableStringify(b));
});

const nodeSha256 = async (input: string) => createHash('sha256').update(input).digest('hex');

function fixtureDump(overrides: Partial<BackupDump> = {}): BackupDump {
  return {
    version: 1,
    exportedAt: 1720000000000,
    weights: [],
    meals: [],
    exercise: [],
    sfl: [],
    settings: {
      kcalTarget: 1500, proteinTargetG: 150, carbsTargetG: 110, fatTargetG: 50,
      heightCm: 200, age: 42, sex: 'male', lastHcSyncMs: 0, lastBackupHash: null, lastBackupAt: null,
    },
    ...overrides,
  };
}

test('hashDump is stable for identical data', async () => {
  const dump = fixtureDump();
  expect(await hashDump(dump, nodeSha256)).toBe(await hashDump(fixtureDump(), nodeSha256));
});

test('hashDump changes when data changes', async () => {
  const a = await hashDump(fixtureDump(), nodeSha256);
  const b = await hashDump(fixtureDump({ weights: [{ id: 1, date: '2026-07-01', lbs: 180, flag: null, createdAt: 1 }] }), nodeSha256);
  expect(a).not.toBe(b);
});

test('hashDump ignores exportedAt so re-dumping unchanged data hashes identically', async () => {
  const a = await hashDump(fixtureDump({ exportedAt: 1 }), nodeSha256);
  const b = await hashDump(fixtureDump({ exportedAt: 2 }), nodeSha256);
  expect(a).toBe(b);
});

test('hashDump ignores bookkeeping settings fields (lastHcSyncMs, lastBackupHash, lastBackupAt) so re-uploading with no real changes hashes identically', async () => {
  const a = await hashDump(
    fixtureDump({
      settings: {
        kcalTarget: 1500, proteinTargetG: 150, carbsTargetG: 110, fatTargetG: 50,
        heightCm: 200, age: 42, sex: 'male', lastHcSyncMs: 0, lastBackupHash: null, lastBackupAt: null,
      },
    }),
    nodeSha256
  );
  const b = await hashDump(
    fixtureDump({
      settings: {
        kcalTarget: 1500, proteinTargetG: 150, carbsTargetG: 110, fatTargetG: 50,
        heightCm: 200, age: 42, sex: 'male', lastHcSyncMs: 1720003600000, lastBackupHash: 'some-prior-hash', lastBackupAt: 1720003600000,
      },
    }),
    nodeSha256
  );
  expect(a).toBe(b);
});

test('hashDump still changes when real user-data settings fields change', async () => {
  const a = await hashDump(fixtureDump(), nodeSha256);
  const b = await hashDump(
    fixtureDump({
      settings: {
        kcalTarget: 1600, proteinTargetG: 150, carbsTargetG: 110, fatTargetG: 50,
        heightCm: 200, age: 42, sex: 'male', lastHcSyncMs: 0, lastBackupHash: null, lastBackupAt: null,
      },
    }),
    nodeSha256
  );
  expect(a).not.toBe(b);
});

test('dumpAll pulls every table into one snapshot', async () => {
  const repos = await makeTestRepos();
  await repos.weights.upsert('2026-07-01', 180);
  await repos.meals.insert({ date: '2026-07-01', name: 'Eggs', detail: '', kcal: 300, proteinG: 20, carbsG: 2, fatG: 22, flags: [], source: 'manual', photoUri: null });
  await repos.exercise.insert({ date: '2026-07-01', activity: 'Run', kcalBurned: 300, source: 'manual', hcRecordId: null });
  await repos.sfl.upsert({ name: 'Chicken Breast', serving: '100g', kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, flags: [] });

  const dump = await dumpAll(repos as unknown as import('../src/db').Repos);

  expect(dump.version).toBe(1);
  expect(dump.weights).toHaveLength(1);
  expect(dump.meals).toHaveLength(1);
  expect(dump.exercise).toHaveLength(1);
  expect(dump.sfl).toHaveLength(1);
  expect(dump.settings.kcalTarget).toBe(1500);
});

test('restoreDump replaces existing data and round-trips through dumpAll', async () => {
  const db = makeTestDb();
  await migrate(db);
  const repos = {
    weights: makeWeightsRepo(db),
    meals: makeMealsRepo(db),
    exercise: makeExerciseRepo(db),
    sfl: makeSflRepo(db),
    settings: makeSettingsRepo(db),
    chat: { add: async () => 0, listByDate: async () => [] },
  };

  // stale data that must be wiped
  await repos.weights.upsert('2020-01-01', 999);
  await repos.meals.insert({ date: '2020-01-01', name: 'Stale', detail: '', kcal: 1, proteinG: 0, carbsG: 0, fatG: 0, flags: [], source: 'manual', photoUri: null });
  await repos.exercise.insert({ date: '2020-01-01', activity: 'StaleWorkout', kcalBurned: 500, source: 'manual', hcRecordId: null });
  await repos.sfl.upsert({ name: 'StaleFood', serving: '100g', kcal: 100, proteinG: 10, carbsG: 5, fatG: 2, flags: [] });

  const source = await makeTestRepos();
  await source.weights.upsert('2026-07-01', 180.5);
  await source.meals.insert({ date: '2026-07-01', name: 'Eggs', detail: '', kcal: 300, proteinG: 20, carbsG: 2, fatG: 22, flags: [], source: 'manual', photoUri: null });
  await source.exercise.insert({ date: '2026-07-01', activity: 'Run', kcalBurned: 400, source: 'manual', hcRecordId: null });
  await source.sfl.upsert({ name: 'Chicken Breast', serving: '100g', kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, flags: [] });
  await source.settings.set({ kcalTarget: 1600 });
  const dump = await dumpAll(source as unknown as import('../src/db').Repos);

  await restoreDump(dump, repos as unknown as import('../src/db').Repos, db);

  const restoredDump = await dumpAll(repos as unknown as import('../src/db').Repos);
  expect(restoredDump.weights.map(({ date, lbs, flag }) => ({ date, lbs, flag }))).toEqual(
    dump.weights.map(({ date, lbs, flag }) => ({ date, lbs, flag }))
  );
  expect(restoredDump.meals.map((m) => m.name)).toEqual(['Eggs']);
  expect(restoredDump.exercise.map((e) => e.activity)).toEqual(['Run']);
  expect(restoredDump.sfl.map((s) => s.name)).toEqual(['Chicken Breast']);
  expect(restoredDump.settings.kcalTarget).toBe(1600);
});
