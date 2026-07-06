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
  // Seed multiple weight entries: 7 days ago, 1 day ago, and today
  await repos.weights.upsert('2026-06-29', 200, null);
  await repos.weights.upsert('2026-07-05', 198, null);
  await repos.weights.upsert('2026-07-06', 196, null);

  const { contextBlock } = await buildContext(repos, '2026-07-06');

  // Should compute deltas using latest entry (2026-07-06 @ 196 lbs)
  // priorDelta: 196 - 198 = -2.0 lbs
  // sevenDayDelta: 196 - 200 = -4.0 lbs
  expect(contextBlock).toContain('WEIGHT: latest delta -2 lbs vs prior, -4 lbs vs 7 days ago.');
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
