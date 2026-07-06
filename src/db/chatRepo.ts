import { ChatMessage } from '../types';
import { SqlDb } from './sqlDb';

const COLS = 'id, date, role, content, created_at AS createdAt';
type ChatRole = ChatMessage['role'];
type ChatRow = Omit<ChatMessage, 'role'> & { role: string };

function rowToMessage(row: ChatRow): ChatMessage {
  return { ...row, role: row.role as ChatRole };
}

export function makeChatRepo(db: SqlDb) {
  return {
    async add(date: string, role: ChatRole, content: string): Promise<number> {
      const result = await db.runAsync(
        'INSERT INTO chat_messages (date, role, content, created_at) VALUES (?, ?, ?, ?)',
        date,
        role,
        content,
        Date.now()
      );
      return result.lastInsertRowId;
    },
    async listByDate(date: string): Promise<ChatMessage[]> {
      const rows = await db.getAllAsync<ChatRow>(`SELECT ${COLS} FROM chat_messages WHERE date = ? ORDER BY created_at ASC, id ASC`, date);
      return rows.map(rowToMessage);
    },
  };
}

export type ChatRepo = ReturnType<typeof makeChatRepo>;