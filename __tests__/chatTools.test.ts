import { TOOL_HANDLERS, CHAT_FUNCTIONS } from '../src/api/chatTools';
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

test('CHAT_FUNCTIONS declares all 7 spec functions', () => {
  const names = CHAT_FUNCTIONS.map((f) => f.name).sort();
  expect(names).toEqual(
    ['add_sfl_item', 'get_today_summary', 'log_exercise', 'log_meal', 'log_weight', 'query_log', 'update_entry'].sort()
  );
});

test('log_meal inserts a meal for the given day', async () => {
  const repos = await makeRepos();
  const result = await TOOL_HANDLERS.log_meal({ name: 'Eggs', kcal: 140, proteinG: 12, carbsG: 1, fatG: 10 }, repos, '2026-07-06');
  expect(result).toEqual({ id: expect.any(Number) });
  const meals = await repos.meals.listByDate('2026-07-06');
  expect(meals[0].name).toBe('Eggs');
  expect(meals[0].source).toBe('chat');
});

test('log_weight upserts by date', async () => {
  const repos = await makeRepos();
  await TOOL_HANDLERS.log_weight({ lbs: 181.2 }, repos, '2026-07-06');
  const w = await repos.weights.byDate('2026-07-06');
  expect(w?.lbs).toBe(181.2);
});

test('log_exercise inserts a chat-sourced entry', async () => {
  const repos = await makeRepos();
  await TOOL_HANDLERS.log_exercise({ activity: 'Walk', kcalBurned: 150 }, repos, '2026-07-06');
  expect(await repos.exercise.burnByDate('2026-07-06')).toBe(150);
});

test('add_sfl_item upserts by name', async () => {
  const repos = await makeRepos();
  await TOOL_HANDLERS.add_sfl_item({ name: 'Almonds', kcal: 170 }, repos, '2026-07-06');
  const item = await repos.sfl.byName('Almonds');
  expect(item?.kcal).toBe(170);
});

test('update_entry patches a meal by id', async () => {
  const repos = await makeRepos();
  const id = await repos.meals.insert({
    date: '2026-07-06', name: 'Toast', detail: '', kcal: 100, proteinG: 3, carbsG: 20, fatG: 1, flags: [], source: 'manual', photoUri: null,
  });
  await TOOL_HANDLERS.update_entry({ kind: 'meal', id, patch: { kcal: 120 } }, repos, '2026-07-06');
  const meals = await repos.meals.listByDate('2026-07-06');
  expect(meals[0].kcal).toBe(120);
});

test('update_entry upserts a weight for kind weight', async () => {
  const repos = await makeRepos();
  await TOOL_HANDLERS.update_entry({ kind: 'weight', patch: { lbs: 179.5 } }, repos, '2026-07-06');
  const w = await repos.weights.byDate('2026-07-06');
  expect(w?.lbs).toBe(179.5);
});

test('update_entry patches an exercise entry by id', async () => {
  const repos = await makeRepos();
  const id = await repos.exercise.insert({
    date: '2026-07-06', activity: 'Walk', kcalBurned: 150, source: 'manual', hcRecordId: null,
  });
  await TOOL_HANDLERS.update_entry({ kind: 'exercise', id, patch: { kcalBurned: 200 } }, repos, '2026-07-06');
  const exercise = await repos.exercise.listByDate('2026-07-06');
  expect(exercise[0].kcalBurned).toBe(200);
});

test('update_entry weight patch preserves existing lbs when patch omits it', async () => {
  const repos = await makeRepos();
  await repos.weights.upsert('2026-07-06', 180, null);
  await TOOL_HANDLERS.update_entry({ kind: 'weight', patch: { flag: 'outlier' } }, repos, '2026-07-06');
  const w = await repos.weights.byDate('2026-07-06');
  expect(w?.lbs).toBe(180);
  expect(w?.flag).toBe('outlier');
});

test('query_log returns meals, exercise, and weight for the date', async () => {
  const repos = await makeRepos();
  await repos.meals.insert({ date: '2026-07-06', name: 'Toast', detail: '', kcal: 100, proteinG: 3, carbsG: 20, fatG: 1, flags: [], source: 'manual', photoUri: null });
  const result = await TOOL_HANDLERS.query_log({}, repos, '2026-07-06');
  expect(result.date).toBe('2026-07-06');
  expect((result.meals as unknown[]).length).toBe(1);
});

test('get_today_summary returns net summary and null deltas with no weights', async () => {
  const repos = await makeRepos();
  await repos.meals.insert({ date: '2026-07-06', name: 'Toast', detail: '', kcal: 100, proteinG: 3, carbsG: 20, fatG: 1, flags: [], source: 'manual', photoUri: null });
  const result = await TOOL_HANDLERS.get_today_summary({}, repos, '2026-07-06');
  expect((result.summary as { eatenKcal: number }).eatenKcal).toBe(100);
  expect(result.deltas).toBeNull();
});
