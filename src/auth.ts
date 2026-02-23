import input from 'input';
import { StringSession } from 'telegram/sessions/index.js';
import { TelegramClient } from 'telegram';
import { loadConfig } from './config.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

function loadSessionString(path: string): string {
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8').trim();
}

function saveSessionString(path: string, value: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value, 'utf8');
}

export async function authLogin(): Promise<void> {
  const cfg = loadConfig();
  const session = new StringSession(loadSessionString(cfg.sessionPath));
  const client = new TelegramClient(session, cfg.apiId, cfg.apiHash, { connectionRetries: 5 });

  await client.start({
    phoneNumber: async () => input.text('Phone number (+44...): '),
    password: async () => input.text('2FA password (if any): '),
    phoneCode: async () => input.text('Telegram login code: '),
    onError: (err) => {
      throw err;
    }
  });

  const value = client.session.save();
  saveSessionString(cfg.sessionPath, String(value));
  console.log(JSON.stringify({ ok: true, sessionPath: cfg.sessionPath }, null, 2));
  await client.disconnect();
}

export async function authStatus(): Promise<void> {
  const cfg = loadConfig();
  const hasSession = existsSync(cfg.sessionPath) && readFileSync(cfg.sessionPath, 'utf8').trim().length > 0;
  console.log(JSON.stringify({ ok: true, hasSession, sessionPath: cfg.sessionPath }, null, 2));
}
