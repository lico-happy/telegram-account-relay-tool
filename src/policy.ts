import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export type PolicyState = {
  recentHashes: string[];
  lastSentAtByChat: Record<string, number>;
};

const STATE_PATH = process.env.TG_POLICY_STATE_PATH ?? '/data/policy-state.json';
const COOLDOWN_MS = Number(process.env.TG_SEND_COOLDOWN_MS ?? 2500);
const HASH_WINDOW = Number(process.env.TG_HASH_WINDOW ?? 50);

function loadState(): PolicyState {
  if (!existsSync(STATE_PATH)) return { recentHashes: [], lastSentAtByChat: {} };
  return JSON.parse(readFileSync(STATE_PATH, 'utf8')) as PolicyState;
}

function saveState(state: PolicyState) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function hashMsg(chatId: string, text: string): string {
  return `${chatId}:${text.trim().toLowerCase()}`;
}

export function canSend(chatId: string, text: string): { ok: boolean; reason?: string } {
  const state = loadState();
  const now = Date.now();
  const h = hashMsg(chatId, text);

  if (state.recentHashes.includes(h)) return { ok: false, reason: 'duplicate-message-window' };
  const last = state.lastSentAtByChat[chatId] ?? 0;
  if (now - last < COOLDOWN_MS) return { ok: false, reason: 'chat-cooldown' };

  state.recentHashes.push(h);
  state.recentHashes = state.recentHashes.slice(-HASH_WINDOW);
  state.lastSentAtByChat[chatId] = now;
  saveState(state);
  return { ok: true };
}
