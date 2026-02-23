import { getPool } from './db.js';

export type Cursor = {
  lastMessageId: number;
  lastTimestamp?: string;
  lastRunAt?: string;
};

export async function getCursor(chatId: string): Promise<Cursor | null> {
  const p = getPool();
  const r = await p.query(
    `select last_message_id, last_timestamp, last_run_at from chat_cursor where chat_id = $1`,
    [chatId]
  );
  if (!r.rows[0]) return null;
  return {
    lastMessageId: Number(r.rows[0].last_message_id ?? 0),
    lastTimestamp: r.rows[0].last_timestamp ?? undefined,
    lastRunAt: r.rows[0].last_run_at ? new Date(r.rows[0].last_run_at).toISOString() : undefined
  };
}

export async function setCursor(chatId: string, cursor: Cursor): Promise<void> {
  const p = getPool();
  await p.query(
    `insert into chat_cursor(chat_id, last_message_id, last_timestamp, last_run_at, updated_at)
     values($1,$2,$3,$4, now())
     on conflict(chat_id)
     do update set last_message_id=excluded.last_message_id,
                   last_timestamp=excluded.last_timestamp,
                   last_run_at=excluded.last_run_at,
                   updated_at=now()`,
    [chatId, cursor.lastMessageId, cursor.lastTimestamp ?? null, cursor.lastRunAt ?? new Date().toISOString()]
  );
}

export async function resetCursor(chatId: string): Promise<void> {
  const p = getPool();
  await p.query(`delete from chat_cursor where chat_id = $1`, [chatId]);
}
