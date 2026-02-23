import { Api } from 'telegram';
import { createClient } from './telegram-client.js';
import { canSend } from './policy.js';
import { getCursor, setCursor } from './checkpoint.js';

type MessageOut = { id: number | undefined; text: string | undefined; date: unknown };

async function fetchUnread(chatId: string, limit: number): Promise<{ minId: number; maxId: number; unread: MessageOut[] }> {
  const cursor = await getCursor(chatId);
  const minId = cursor?.lastMessageId ?? 0;
  const client = await createClient();
  const msgs = await client.getMessages(chatId, { limit });
  const unread = msgs
    .filter((m) => (m.id ?? 0) > minId)
    .map((m) => ({ id: m.id, text: m.message, date: m.date }))
    .reverse();
  const maxId = unread.reduce((acc, m) => Math.max(acc, Number(m.id ?? 0)), minId);
  await client.disconnect();
  return { minId, maxId, unread };
}

async function persistCursor(chatId: string, maxId: number, unread: MessageOut[]): Promise<void> {
  const cursor = await getCursor(chatId);
  await setCursor(chatId, {
    lastMessageId: maxId,
    lastTimestamp: unread.length ? String(unread[unread.length - 1].date ?? '') : cursor?.lastTimestamp,
    lastRunAt: new Date().toISOString()
  });
}

export async function readLatest(chatId: string, limit: number): Promise<void> {
  const client = await createClient();
  const msgs = await client.getMessages(chatId, { limit });
  const out = msgs.map((m) => ({ id: m.id, text: m.message, date: m.date })).reverse();
  console.log(JSON.stringify({ ok: true, count: out.length, messages: out }, null, 2));
  await client.disconnect();
}

export async function readUnread(chatId: string, limit: number): Promise<void> {
  const { minId, maxId, unread } = await fetchUnread(chatId, limit);
  await persistCursor(chatId, maxId, unread);
  const cursor = await getCursor(chatId);
  console.log(JSON.stringify({ ok: true, minId, maxId, cursor, count: unread.length, messages: unread }, null, 2));
}

export async function unreadConsume(chatId: string, limit: number): Promise<void> {
  const { minId, maxId, unread } = await fetchUnread(chatId, limit);

  // mark as read in Telegram when we consumed unread payload
  if (unread.length > 0 && maxId > minId) {
    const client = await createClient();
    const peer = await client.getInputEntity(chatId);
    await client.invoke(new Api.messages.ReadHistory({ peer, maxId }));
    await client.disconnect();
  }

  await persistCursor(chatId, maxId, unread);
  const cursor = await getCursor(chatId);
  console.log(
    JSON.stringify(
      { ok: true, consumed: true, markedRead: unread.length > 0, minId, maxId, cursor, count: unread.length, messages: unread },
      null,
      2
    )
  );
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
