import { SqlDb } from './sqlDb';
import { Weight } from '../types';

const COLS = 'id, date, lbs, flag, created_at AS createdAt';

export function makeWeightsRepo(db: SqlDb) {
  return {
    async upsert(date: string, lbs: number, flag: string | null = null): Promise<void> {
      await db.runAsync(
        `INSERT INTO weights (date, lbs, flag, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET lbs = excluded.lbs, flag = excluded.flag`,
        date,
        lbs,
        flag,
        Date.now()
      );
    },
    async byDate(date: string): Promise<Weight | null> {
      return db.getFirstAsync<Weight>(`SELECT ${COLS} FROM weights WHERE date = ?`, date);
    },
    async latest(): Promise<Weight | null> {
      return db.getFirstAsync<Weight>(`SELECT ${COLS} FROM weights ORDER BY date DESC LIMIT 1`);
    },
    async all(): Promise<Weight[]> {
      return db.getAllAsync<Weight>(`SELECT ${COLS} FROM weights ORDER BY date ASC`);
    },
  };
}

export type WeightsRepo = ReturnType<typeof makeWeightsRepo>;