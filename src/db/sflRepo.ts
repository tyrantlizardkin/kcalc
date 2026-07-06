import { NewSflItem, SflItem } from '../types';
import { SqlDb } from './sqlDb';

const COLS = 'id, name, serving, kcal, protein_g AS proteinG, carbs_g AS carbsG, fat_g AS fatG, flags';
type SflRow = Omit<SflItem, 'flags'> & { flags: string };

function rowToSfl(row: SflRow): SflItem {
  return { ...row, flags: JSON.parse(row.flags) as string[] };
}

export function makeSflRepo(db: SqlDb) {
  return {
    async upsert(item: NewSflItem): Promise<void> {
      await db.runAsync(
        `INSERT INTO sfl (name, serving, kcal, protein_g, carbs_g, fat_g, flags)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(name) DO UPDATE SET serving = excluded.serving, kcal = excluded.kcal,
           protein_g = excluded.protein_g, carbs_g = excluded.carbs_g, fat_g = excluded.fat_g, flags = excluded.flags`,
        item.name,
        item.serving,
        item.kcal,
        item.proteinG,
        item.carbsG,
        item.fatG,
        JSON.stringify(item.flags)
      );
    },
    async byName(name: string): Promise<SflItem | null> {
      const row = await db.getFirstAsync<SflRow>(`SELECT ${COLS} FROM sfl WHERE name = ?`, name);
      return row ? rowToSfl(row) : null;
    },
    async all(): Promise<SflItem[]> {
      const rows = await db.getAllAsync<SflRow>(`SELECT ${COLS} FROM sfl ORDER BY name COLLATE NOCASE ASC`);
      return rows.map(rowToSfl);
    },
  };
}

export type SflRepo = ReturnType<typeof makeSflRepo>;