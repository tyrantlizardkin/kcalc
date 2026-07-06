import { makeTestDb } from './helpers/testDb';
import { migrate } from '../src/db/schema';
import { makeMealsRepo } from '../src/db/mealsRepo';
import { makeSflRepo } from '../src/db/sflRepo';

async function setup() {
  const db = makeTestDb();
  await migrate(db);
  return { meals: makeMealsRepo(db), sfl: makeSflRepo(db) };
}

test('meals insert, list by date, and total macros', async () => {
  const { meals } = await setup();
  await meals.insert({
    date: '2026-07-05',
    name: 'eggs',
    detail: 'three eggs',
    kcal: 210,
    proteinG: 18,
    carbsG: 1,
    fatG: 15,
    flags: ['casein'],
    source: 'manual',
    photoUri: null,
  });
  await meals.insert({
    date: '2026-07-05',
    name: 'rice',
    detail: '',
    kcal: 200,
    proteinG: 4,
    carbsG: 44,
    fatG: 0,
    flags: [],
    source: 'chat',
    photoUri: null,
  });
  expect((await meals.listByDate('2026-07-05')).map((m) => m.name)).toEqual(['eggs', 'rice']);
  expect(await meals.totalsByDate('2026-07-05')).toEqual({ kcal: 410, proteinG: 22, carbsG: 45, fatG: 15 });
});

test('sfl upserts by unique name and sorts case-insensitively', async () => {
  const { sfl } = await setup();
  await sfl.upsert({ name: 'Yogurt', serving: '1 cup', kcal: 150, proteinG: 15, carbsG: 10, fatG: 4, flags: ['casein'] });
  await sfl.upsert({ name: 'apple', serving: '1', kcal: 95, proteinG: 0, carbsG: 25, fatG: 0, flags: [] });
  await sfl.upsert({ name: 'Yogurt', serving: '170 g', kcal: 120, proteinG: 17, carbsG: 7, fatG: 0, flags: ['casein'] });
  expect((await sfl.byName('Yogurt'))?.serving).toBe('170 g');
  expect((await sfl.all()).map((i) => i.name)).toEqual(['apple', 'Yogurt']);
});

test('update patches only the given fields', async () => {
  const { meals } = await setup();
  const id = await meals.insert({
    date: '2026-07-06',
    name: 'Oats',
    detail: '',
    kcal: 300,
    proteinG: 10,
    carbsG: 50,
    fatG: 5,
    flags: [],
    source: 'manual',
    photoUri: null,
  });

  await meals.update(id, { kcal: 350, flags: ['gluten'] });

  const [updated] = await meals.listByDate('2026-07-06');
  expect(updated.kcal).toBe(350);
  expect(updated.flags).toEqual(['gluten']);
  expect(updated.name).toBe('Oats');
});

test('update throws for an unknown id', async () => {
  const { meals } = await setup();
  await expect(meals.update(999, { kcal: 1 })).rejects.toThrow();
});