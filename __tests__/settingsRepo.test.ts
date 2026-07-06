import { makeTestDb } from './helpers/testDb';
import { migrate } from '../src/db/schema';
import { makeSettingsRepo, DEFAULT_SETTINGS } from '../src/db/settingsRepo';

async function setup() {
  const db = makeTestDb();
  await migrate(db);
  return makeSettingsRepo(db);
}

test('getAll returns defaults when nothing stored', async () => {
  const repo = await setup();
  expect(await repo.getAll()).toEqual(DEFAULT_SETTINGS);
  expect(DEFAULT_SETTINGS.kcalTarget).toBe(1500);
});

test('set patches persist and merge over defaults', async () => {
  const repo = await setup();
  await repo.set({ kcalTarget: 1600, proteinTargetG: 160 });
  const s = await repo.getAll();
  expect(s.kcalTarget).toBe(1600);
  expect(s.proteinTargetG).toBe(160);
  expect(s.fatTargetG).toBe(DEFAULT_SETTINGS.fatTargetG);
  await repo.set({ kcalTarget: 1500 });
  expect((await repo.getAll()).kcalTarget).toBe(1500);
});

test('lastHcSyncMs defaults to 0 and can be updated', async () => {
  const repo = await setup();
  expect((await repo.getAll()).lastHcSyncMs).toBe(0);
  await repo.set({ lastHcSyncMs: 1720000000000 });
  expect((await repo.getAll()).lastHcSyncMs).toBe(1720000000000);
});