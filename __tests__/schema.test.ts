import { makeTestDb } from './helpers/testDb';
import { migrate } from '../src/db/schema';

test('migrate creates all tables and sets user_version 1', async () => {
  const db = makeTestDb();
  await migrate(db);
  const v = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  expect(v?.user_version).toBe(1);
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  expect(tables.map((t) => t.name)).toEqual([
    'chat_messages',
    'exercise',
    'meals',
    'settings',
    'sfl',
    'weights',
  ]);
});

test('migrate is idempotent', async () => {
  const db = makeTestDb();
  await migrate(db);
  await expect(migrate(db)).resolves.toBeUndefined();
});