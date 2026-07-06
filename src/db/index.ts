import * as SQLite from 'expo-sqlite';
import { makeChatRepo } from './chatRepo';
import { makeExerciseRepo } from './exerciseRepo';
import { makeMealsRepo } from './mealsRepo';
import { migrate } from './schema';
import { makeSettingsRepo } from './settingsRepo';
import { makeSflRepo } from './sflRepo';
import { SqlDb } from './sqlDb';
import { makeWeightsRepo } from './weightsRepo';

export type Repos = ReturnType<typeof makeRepos>;

function makeRepos(db: SqlDb) {
  return {
    weights: makeWeightsRepo(db),
    meals: makeMealsRepo(db),
    exercise: makeExerciseRepo(db),
    sfl: makeSflRepo(db),
    chat: makeChatRepo(db),
    settings: makeSettingsRepo(db),
  };
}

let dbPromise: Promise<SqlDb> | null = null;

export async function getDb(): Promise<SqlDb> {
  dbPromise ??= SQLite.openDatabaseAsync('kcalc.db')
    .then(async (db) => {
      await migrate(db);
      return db;
    })
    .catch((error: unknown) => {
      dbPromise = null;
      throw error;
    });
  return dbPromise;
}

let reposPromise: Promise<Repos> | null = null;

export async function getRepos(): Promise<Repos> {
  reposPromise ??= getDb()
    .then((db) => makeRepos(db))
    .catch((error: unknown) => {
      reposPromise = null;
      throw error;
    });
  return reposPromise;
}