import dotenv from 'dotenv';

dotenv.config();

export type RelayConfig = {
  apiId: number;
  apiHash: string;
  sessionPath: string;
  defaultChatId?: string;
};

export function loadConfig(): RelayConfig {
  const apiId = Number(process.env.TG_API_ID);
  const apiHash = process.env.TG_API_HASH;
  const sessionPath = process.env.TG_SESSION_PATH ?? '/data/telegram.session';

  if (!Number.isFinite(apiId) || !apiHash) {
    throw new Error('Missing TG_API_ID or TG_API_HASH in environment');
  }

  return {
    apiId,
    apiHash,
    sessionPath,
    defaultChatId: process.env.TG_DEFAULT_CHAT_ID
  };
}
