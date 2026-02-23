import { readLatest, readUnread, sendMessage } from './messages.js';

export async function runOpenClawTool(payloadRaw: string): Promise<void> {
  const payload = JSON.parse(payloadRaw) as
    | { action: 'read'; chat: string; limit?: number }
    | { action: 'unread'; chat: string; limit?: number }
    | { action: 'send'; chat: string; text: string };

  if (payload.action === 'read') return readLatest(payload.chat, payload.limit ?? 20);
  if (payload.action === 'unread') return readUnread(payload.chat, payload.limit ?? 50);
  if (payload.action === 'send') return sendMessage(payload.chat, payload.text);
  throw new Error('Unknown action');
}
