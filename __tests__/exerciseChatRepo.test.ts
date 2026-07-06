import { makeTestDb } from './helpers/testDb';
import { migrate } from '../src/db/schema';
import { makeExerciseRepo } from '../src/db/exerciseRepo';
import { makeChatRepo } from '../src/db/chatRepo';

async function setup() {
  const db = makeTestDb();
  await migrate(db);
  return { exercise: makeExerciseRepo(db), chat: makeChatRepo(db) };
}

test('exercise inserts and health connect record ids dedupe', async () => {
  const { exercise } = await setup();
  await exercise.insert({ date: '2026-07-05', activity: 'walk', kcalBurned: 120, source: 'manual', hcRecordId: null });
  await exercise.insert({ date: '2026-07-05', activity: 'ride', kcalBurned: 300, source: 'healthconnect', hcRecordId: 'hc-1' });
  await exercise.insert({ date: '2026-07-05', activity: 'ride', kcalBurned: 320, source: 'healthconnect', hcRecordId: 'hc-1' });
  expect(await exercise.burnByDate('2026-07-05')).toBe(440);
  expect((await exercise.listByDate('2026-07-05')).map((e) => e.activity)).toEqual(['walk', 'ride']);
});

test('chat stores per-day messages in insertion order', async () => {
  const { chat } = await setup();
  await chat.add('2026-07-05', 'user', 'log chicken');
  await chat.add('2026-07-05', 'model', 'logged');
  await chat.add('2026-07-04', 'user', 'old');
  expect((await chat.listByDate('2026-07-05')).map((m) => m.content)).toEqual(['log chicken', 'logged']);
});