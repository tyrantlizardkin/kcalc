import { MacroTotals, Meal, MealSource, NewMeal } from '../types';
import { SqlDb } from './sqlDb';

const COLS = `id, date, name, detail, kcal, protein_g AS proteinG, carbs_g AS carbsG,
  fat_g AS fatG, flags, source, photo_uri AS photoUri, created_at AS createdAt`;

type MealRow = Omit<Meal, 'flags' | 'source'> & { flags: string; source: string };

function rowToMeal(row: MealRow): Meal {
  return { ...row, flags: JSON.parse(row.flags) as string[], source: row.source as MealSource };
}

export function makeMealsRepo(db: SqlDb) {
  return {
    async insert(meal: NewMeal): Promise<number> {
      const result = await db.runAsync(
        `INSERT INTO meals (date, name, detail, kcal, protein_g, carbs_g, fat_g, flags, source, photo_uri, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        meal.date,
        meal.name,
        meal.detail,
        meal.kcal,
        meal.proteinG,
        meal.carbsG,
        meal.fatG,
        JSON.stringify(meal.flags),
        meal.source,
        meal.photoUri,
        Date.now()
      );
      return result.lastInsertRowId;
    },
    async update(id: number, patch: Partial<NewMeal>): Promise<void> {
      const row = await db.getFirstAsync<MealRow>(`SELECT ${COLS} FROM meals WHERE id = ?`, id);
      if (!row) throw new Error(`Meal ${id} not found`);
      const merged: NewMeal = { ...rowToMeal(row), ...patch };
      await db.runAsync(
        `UPDATE meals SET date = ?, name = ?, detail = ?, kcal = ?, protein_g = ?, carbs_g = ?, fat_g = ?, flags = ?, source = ?, photo_uri = ? WHERE id = ?`,
        merged.date,
        merged.name,
        merged.detail,
        merged.kcal,
        merged.proteinG,
        merged.carbsG,
        merged.fatG,
        JSON.stringify(merged.flags),
        merged.source,
        merged.photoUri,
        id
      );
    },
    async listByDate(date: string): Promise<Meal[]> {
      const rows = await db.getAllAsync<MealRow>(`SELECT ${COLS} FROM meals WHERE date = ? ORDER BY created_at ASC, id ASC`, date);
      return rows.map(rowToMeal);
    },
    async all(): Promise<Meal[]> {
      const rows = await db.getAllAsync<MealRow>(`SELECT ${COLS} FROM meals ORDER BY date ASC, created_at ASC, id ASC`);
      return rows.map(rowToMeal);
    },
    async totalsByDate(date: string): Promise<MacroTotals> {
      const row = await db.getFirstAsync<MacroTotals>(
        `SELECT COALESCE(SUM(kcal), 0) AS kcal,
          COALESCE(SUM(protein_g), 0) AS proteinG,
          COALESCE(SUM(carbs_g), 0) AS carbsG,
          COALESCE(SUM(fat_g), 0) AS fatG
         FROM meals WHERE date = ?`,
        date
      );
      return row ?? { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
    },
  };
}

export type MealsRepo = ReturnType<typeof makeMealsRepo>;