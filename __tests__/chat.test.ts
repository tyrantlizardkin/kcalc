import { sendChatMessage } from '../src/api/chat';
import * as gemini from '../src/api/gemini';
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

test('returns model text immediately when there are no function calls', async () => {
  jest.spyOn(gemini, 'generateContent').mockResolvedValueOnce({ text: 'Logged.', functionCalls: [] });
  const repos = await makeRepos();
  const reply = await sendChatMessage('just checking in', '2026-07-06', repos);
  expect(reply).toBe('Logged.');
});

test('executes a function call, feeds the result back, and returns the final text', async () => {
  jest
    .spyOn(gemini, 'generateContent')
    .mockResolvedValueOnce({ text: null, functionCalls: [{ name: 'log_weight', args: { lbs: 180 } }] })
    .mockResolvedValueOnce({ text: 'Weight logged: 180 lbs.', functionCalls: [] });

  const repos = await makeRepos();
  const reply = await sendChatMessage('180', '2026-07-06', repos);

  expect(reply).toBe('Weight logged: 180 lbs.');
  const w = await repos.weights.byDate('2026-07-06');
  expect(w?.lbs).toBe(180);
  expect(gemini.generateContent).toHaveBeenCalledTimes(2);
});

test('returns a fallback message after hitting the iteration cap', async () => {
  jest
    .spyOn(gemini, 'generateContent')
    .mockResolvedValue({ text: null, functionCalls: [{ name: 'get_today_summary', args: {} }] });

  const repos = await makeRepos();
  const reply = await sendChatMessage('loop forever', '2026-07-06', repos);

  expect(reply).toMatch(/tool-call limit/i);
  expect(gemini.generateContent).toHaveBeenCalledTimes(5);
});

afterEach(() => {
  jest.restoreAllMocks();
});
