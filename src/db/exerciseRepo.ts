import { ExerciseEntry, ExerciseSource, NewExercise } from '../types';
import { SqlDb } from './sqlDb';

const COLS = `id, date, activity, kcal_burned AS kcalBurned, source,
  hc_record_id AS hcRecordId, created_at AS createdAt`;

type ExerciseRow = Omit<ExerciseEntry, 'source'> & { source: string };

function rowToExercise(row: ExerciseRow): ExerciseEntry {
  return { ...row, source: row.source as ExerciseSource };
}

export function makeExerciseRepo(db: SqlDb) {
  return {
    async insert(entry: NewExercise): Promise<number> {
      const result = await db.runAsync(
        `INSERT INTO exercise (date, activity, kcal_burned, source, hc_record_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(hc_record_id) DO UPDATE SET date = excluded.date, activity = excluded.activity,
           kcal_burned = excluded.kcal_burned, source = excluded.source`,
        entry.date,
        entry.activity,
        entry.kcalBurned,
        entry.source,
        entry.hcRecordId,
        Date.now()
      );
      return result.lastInsertRowId;
    },
    async listByDate(date: string): Promise<ExerciseEntry[]> {
      const rows = await db.getAllAsync<ExerciseRow>(`SELECT ${COLS} FROM exercise WHERE date = ? ORDER BY created_at ASC, id ASC`, date);
      return rows.map(rowToExercise);
    },
    async burnByDate(date: string): Promise<number> {
      const row = await db.getFirstAsync<{ kcalBurned: number }>(
        'SELECT COALESCE(SUM(kcal_burned), 0) AS kcalBurned FROM exercise WHERE date = ?',
        date
      );
      return row?.kcalBurned ?? 0;
    },
  };
}

export type ExerciseRepo = ReturnType<typeof makeExerciseRepo>;