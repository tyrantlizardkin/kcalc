import { makeTestDb } from './helpers/testDb';
import { migrate } from '../src/db/schema';
import { makeWeightsRepo } from '../src/db/weightsRepo';

async function setup() {
  const db = makeTestDb();
  await migrate(db);
  return makeWeightsRepo(db);
}

test('upsert inserts then updates same date', async () => {
  const repo = await setup();
  await repo.upsert('2026-07-05', 337.8);
  await repo.upsert('2026-07-05', 337.4);
  const all = await repo.all();
  expect(all).toHaveLength(1);
  expect(all[0].lbs).toBe(337.4);
  expect(all[0].flag).toBeNull();
});

test('upsert stores flag; all() is date-ascending; latest() returns newest', async () => {
  const repo = await setup();
  await repo.upsert('2026-07-03', 337.8);
  await repo.upsert('2026-06-12', 323.8, 'outlier');
  await repo.upsert('2026-07-01', 338.0);
  const all = await repo.all();
  expect(all.map((w) => w.date)).toEqual(['2026-06-12', '2026-07-01', '2026-07-03']);
  expect(all[0].flag).toBe('outlier');
  expect((await repo.latest())?.date).toBe('2026-07-03');
  expect((await repo.byDate('2026-07-01'))?.lbs).toBe(338.0);
  expect(await repo.byDate('2026-07-04')).toBeNull();
});