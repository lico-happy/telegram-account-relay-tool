import { getPool } from './db.js';

const COOLDOWN_MS = Number(process.env.TG_SEND_COOLDOWN_MS ?? 2500);
const HASH_WINDOW = Number(process.env.TG_HASH_WINDOW ?? 50);

function hashMsg(chatId: string, text: string): string {
  return `${chatId}:${text.trim().toLowerCase()}`;
}

export async function canSend(chatId: string, text: string): Promise<{ ok: boolean; reason?: string }> {
  const p = getPool();
  const now = Date.now();
  const h = hashMsg(chatId, text);

  const dup = await p.query(
    `select 1 from message_hash_window where chat_id = $1 and hash = $2 order by created_at desc limit 1`,
    [chatId, h]
  );
  if (dup.rowCount && dup.rowCount > 0) return { ok: false, reason: 'duplicate-message-window' };

  const state = await p.query(`select last_sent_at_ms from policy_state where chat_id = $1`, [chatId]);
  const last = Number(state.rows[0]?.last_sent_at_ms ?? 0);
  if (now - last < COOLDOWN_MS) return { ok: false, reason: 'chat-cooldown' };

  await p.query(
    `insert into policy_state(chat_id, last_sent_at_ms) values($1,$2)
     on conflict(chat_id) do update set last_sent_at_ms = excluded.last_sent_at_ms`,
    [chatId, now]
  );

  await p.query(`insert into message_hash_window(chat_id, hash) values($1,$2)`, [chatId, h]);
  await p.query(
    `delete from message_hash_window where id in (
      select id from message_hash_window where chat_id = $1 order by created_at desc offset $2
    )`,
    [chatId, HASH_WINDOW]
  );

  return { ok: true };
}
