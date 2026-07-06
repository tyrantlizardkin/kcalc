import { buildContext } from '../src/api/chatPersona';
import { makeTestDb } from './helpers/testDb';
import { migrate } from '../src/db/schema';
import { makeMealsRepo } from '../src/db/mealsRepo';
import { makeExerciseRepo } from '../src/db/exerciseRepo';
import { makeSettingsRepo } from '../src/db/settingsRepo';
import { makeWeightsRepo } from '../src/db/weightsRepo';
import { makeSflRepo } from '../src/db/sflRepo';
import { makeChatRepo } from '../src/db/chatRepo';
import { Repos } from '../src/db';

async function makeRepos(): Promise<Repos> {
  const db = makeTestDb();
  await migrate(db);
  return {
    meals: makeMealsRepo(db),
    exercise: makeExerciseRepo(db),
    settings: makeSettingsRepo(db),
    weights: makeWeightsRepo(db),
    sfl: makeSflRepo(db),
    chat: makeChatRepo(db),
  };
}

test('buildContext includes targets, today totals, and sfl items', async () => {
  const repos = await makeRepos();
  await repos.sfl.upsert({ name: 'Chicken breast', serving: '4oz', kcal: 180, proteinG: 35, carbsG: 0, fatG: 4, flags: [] });
  await repos.meals.insert({
    date: '2026-07-06',
    name: 'Chicken breast',
    detail: '',
    kcal: 180,
    proteinG: 35,
    carbsG: 0,
    fatG: 4,
    flags: [],
    source: 'manual',
    photoUri: null,
  });

  const { systemPrompt, contextBlock } = await buildContext(repos, '2026-07-06');

  expect(systemPrompt).toContain('Terse');
  expect(contextBlock).toContain('TARGETS: 1500 kcal net');
  expect(contextBlock).toContain('ate 180 kcal');
  expect(contextBlock).toContain('Chicken breast (4oz): 180 kcal');
});

test('buildContext reports no weight entries when there are none', async () => {
  const repos = await makeRepos();
  const { contextBlock } = await buildContext(repos, '2026-07-06');
  expect(contextBlock).toContain('WEIGHT: no entries yet.');
});

test('buildContext computes real weight deltas using latest weight entry date', async () => {
  const repos = await makeRepos();
  // Seed weight entries: ~7 days ago, 2 days ago, and 1 day ago
  // Turn date (2026-07-06) is later than the latest weight entry (2026-07-05)
  // This tests that deltas use latest.date (2026-07-05), not the turn date (2026-07-06)
  await repos.weights.upsert('2026-06-28', 200, null);
  await repos.weights.upsert('2026-07-04', 199, null);
  await repos.weights.upsert('2026-07-05', 198, null);

  const { contextBlock } = await buildContext(repos, '2026-07-06');

  // Should compute deltas using latest entry (2026-07-05 @ 198 lbs)
  // priorDelta: 198 - 199 = -1.0 lbs
  // sevenDayDelta: 198 - 200 = -2.0 lbs
  expect(contextBlock).toContain('WEIGHT: latest delta -1 lbs vs prior, -2 lbs vs 7 days ago.');
});

test('buildContext includes TODAY\'S FLAGS with meal sensitivity flags', async () => {
  const repos = await makeRepos();
  await repos.weights.upsert('2026-07-06', 196, null);
  // Seed a meal with gluten flag
  await repos.meals.insert({
    date: '2026-07-06',
    name: 'Bread with butter',
    detail: '',
    kcal: 300,
    proteinG: 10,
    carbsG: 40,
    fatG: 12,
    flags: ['gluten'],
    source: 'manual',
    photoUri: null,
  });

  const { contextBlock } = await buildContext(repos, '2026-07-06');

  expect(contextBlock).toContain("TODAY'S FLAGS: gluten.");
});

test('buildContext includes LAST 7 DAYS with meals and exercise across multiple days', async () => {
  const repos = await makeRepos();
  // Seed meals across a few of the 7 days before 2026-07-06
  // 4 days ago: 500 kcal meals
  await repos.meals.insert({
    date: '2026-07-02',
    name: 'Breakfast',
    detail: '',
    kcal: 300,
    proteinG: 20,
    carbsG: 30,
    fatG: 10,
    flags: [],
    source: 'manual',
    photoUri: null,
  });
  await repos.meals.insert({
    date: '2026-07-02',
    name: 'Lunch',
    detail: '',
    kcal: 200,
    proteinG: 15,
    carbsG: 20,
    fatG: 8,
    flags: [],
    source: 'manual',
    photoUri: null,
  });
  // 2 days ago: 400 kcal meals + 100 kcal exercise
  await repos.meals.insert({
    date: '2026-07-04',
    name: 'Dinner',
    detail: '',
    kcal: 400,
    proteinG: 30,
    carbsG: 40,
    fatG: 15,
    flags: [],
    source: 'manual',
    photoUri: null,
  });
  await repos.exercise.insert({
    date: '2026-07-04',
    activity: 'Running',
    kcalBurned: 100,
    source: 'manual',
    hcRecordId: null,
  });

  const { contextBlock } = await buildContext(repos, '2026-07-06');

  // Assert LAST 7 DAYS header is present
  expect(contextBlock).toContain('LAST 7 DAYS:');
  // Assert at least one correctly formatted day line
  expect(contextBlock).toContain('2026-07-02: ate 500 kcal, burned 0 kcal, net 500 kcal');
  expect(contextBlock).toContain('2026-07-04: ate 400 kcal, burned 100 kcal, net 300 kcal');
});
