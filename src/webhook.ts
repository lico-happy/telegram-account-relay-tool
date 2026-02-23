import express from 'express';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

type QueueItem = {
  at: string;
  source: string;
  payload: unknown;
};

function queuePath(): string {
  return process.env.TG_WEBHOOK_QUEUE_PATH ?? '/data/webhook-queue.json';
}

function loadQueue(): QueueItem[] {
  const path = queuePath();
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf8')) as QueueItem[];
}

function saveQueue(items: QueueItem[]): void {
  const path = queuePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(items, null, 2));
}

export async function runWebhookServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/webhook', (req: any, res: any) => {
    const q = loadQueue();
    q.push({ at: new Date().toISOString(), source: 'telegram-webhook', payload: req.body });
    saveQueue(q.slice(-1000));
    res.json({ ok: true, queued: q.length });
  });

  app.get('/healthz', (_: any, res: any) => res.json({ ok: true }));

  const port = Number(process.env.TG_WEBHOOK_PORT ?? 8788);
  app.listen(port, () => console.log(JSON.stringify({ ok: true, mode: 'webhook', port }, null, 2)));
}

export function consumeWebhookQueue(limit: number): void {
  const q = loadQueue();
  const take = q.slice(0, limit);
  const rest = q.slice(limit);
  saveQueue(rest);
  console.log(JSON.stringify({ ok: true, consumed: take.length, items: take }, null, 2));
}
