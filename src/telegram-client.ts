import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { existsSync, readFileSync } from 'node:fs';
import { loadConfig } from './config.js';

export async function createClient(): Promise<TelegramClient> {
  const cfg = loadConfig();
  const sessionString = existsSync(cfg.sessionPath) ? readFileSync(cfg.sessionPath, 'utf8').trim() : '';
  const client = new TelegramClient(new StringSession(sessionString), cfg.apiId, cfg.apiHash, {
    connectionRetries: 5
  });
  await client.connect();
  return client;
}
