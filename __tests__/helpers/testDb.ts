import Database from 'better-sqlite3';
import { SqlDb, SqlParam } from '../../src/db/sqlDb';

export function makeTestDb(): SqlDb {
  const db = new Database(':memory:');
  return {
    async execAsync(sql: string) {
      db.exec(sql);
    },
    async runAsync(sql: string, ...params: SqlParam[]) {
      const info = db.prepare(sql).run(...params);
      return { lastInsertRowId: Number(info.lastInsertRowid), changes: info.changes };
    },
    async getAllAsync<T>(sql: string, ...params: SqlParam[]) {
      return db.prepare(sql).all(...params) as T[];
    },
    async getFirstAsync<T>(sql: string, ...params: SqlParam[]) {
      return (db.prepare(sql).get(...params) ?? null) as T | null;
    },
  };
}