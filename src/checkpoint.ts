import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export type Cursor = {
  lastMessageId: number;
  lastTimestamp?: string;
  lastRunAt?: string;
};

export type Checkpoint = Record<string, Cursor>;

function checkpointPath(): string {
  return process.env.TG_CHECKPOINT_PATH ?? '/data/checkpoint.json';
}

export function loadCheckpoint(): Checkpoint {
  const path = checkpointPath();
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf8')) as Checkpoint;
}

export function saveCheckpoint(cp: Checkpoint): void {
  const path = checkpointPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(cp, null, 2));
}

export function resetCursor(chatId: string): void {
  const cp = loadCheckpoint();
  delete cp[chatId];
  saveCheckpoint(cp);
}
