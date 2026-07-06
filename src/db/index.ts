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

let reposPromise: Promise<Repos> | null = null;

export async function getRepos(): Promise<Repos> {
  reposPromise ??= SQLite.openDatabaseAsync('kcalc.db').then(async (db) => {
    await migrate(db);
    return makeRepos(db);
  });
  return reposPromise;
}