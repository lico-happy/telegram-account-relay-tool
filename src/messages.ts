import { createClient } from './telegram-client.js';
import { canSend } from './policy.js';
import { getCursor, setCursor } from './checkpoint.js';

export async function readLatest(chatId: string, limit: number): Promise<void> {
  const client = await createClient();
  const msgs = await client.getMessages(chatId, { limit });
  const out = msgs.map((m) => ({ id: m.id, text: m.message, date: m.date })).reverse();
  console.log(JSON.stringify({ ok: true, count: out.length, messages: out }, null, 2));
  await client.disconnect();
}

export async function readUnread(chatId: string, limit: number): Promise<void> {
  const cursor = await getCursor(chatId);
  const minId = cursor?.lastMessageId ?? 0;
  const client = await createClient();
  const msgs = await client.getMessages(chatId, { limit });
  const unread = msgs
    .filter((m) => (m.id ?? 0) > minId)
    .map((m) => ({ id: m.id, text: m.message, date: m.date }))
    .reverse();

  const maxId = unread.reduce((acc, m) => Math.max(acc, Number(m.id ?? 0)), minId);
  const nextCursor = {
    lastMessageId: maxId,
    lastTimestamp: unread.length ? String(unread[unread.length - 1].date ?? '') : cursor?.lastTimestamp,
    lastRunAt: new Date().toISOString()
  };

  await setCursor(chatId, nextCursor);

  console.log(JSON.stringify({ ok: true, minId, maxId, cursor: nextCursor, count: unread.length, messages: unread }, null, 2));
  await client.disconnect();
}

export async function sendMessage(chatId: string, text: string): Promise<void> {
  const gate = await canSend(chatId, text);
  if (!gate.ok) {
    console.log(JSON.stringify({ ok: false, blocked: true, reason: gate.reason }, null, 2));
    return;
  }
  const client = await createClient();
  const sent = await client.sendMessage(chatId, { message: text });
  console.log(JSON.stringify({ ok: true, id: sent.id }, null, 2));
  await client.disconnect();
}
