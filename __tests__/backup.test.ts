import { createHash } from 'crypto';
import { stableStringify, hashDump, BackupDump } from '../src/lib/backup';

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
