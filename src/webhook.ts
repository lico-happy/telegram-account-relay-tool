import express from 'express';
import { getPool } from './db.js';

export async function runWebhookServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/webhook', async (req: any, res: any) => {
    const p = getPool();
    await p.query(`insert into webhook_queue(source, payload) values($1,$2::jsonb)`, [
      'telegram-webhook',
      JSON.stringify(req.body ?? {})
    ]);
    const c = await p.query(`select count(*)::int as c from webhook_queue`);
    res.json({ ok: true, queued: c.rows[0]?.c ?? 0 });
  });

  app.get('/healthz', (_: any, res: any) => res.json({ ok: true }));

  const port = Number(process.env.TG_WEBHOOK_PORT ?? 8788);
  app.listen(port, () => console.log(JSON.stringify({ ok: true, mode: 'webhook', port }, null, 2)));
}

export async function consumeWebhookQueue(limit: number): Promise<void> {
  const p = getPool();
  const r = await p.query(`select id, source, payload, created_at from webhook_queue order by id asc limit $1`, [limit]);
  const ids = r.rows.map((x) => Number(x.id));
  if (ids.length > 0) {
    await p.query(`delete from webhook_queue where id = any($1::bigint[])`, [ids]);
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        consumed: r.rowCount ?? 0,
        items: r.rows.map((x) => ({ id: x.id, source: x.source, payload: x.payload, at: x.created_at }))
      },
      null,
      2
    )
  );
}
