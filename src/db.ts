import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Missing DATABASE_URL');
  pool = new Pool({ connectionString });
  return pool;
}

export async function migrate(): Promise<void> {
  const p = getPool();
  await p.query(`
    create table if not exists chat_cursor (
      chat_id text primary key,
      last_message_id bigint not null default 0,
      last_timestamp text,
      last_run_at timestamptz,
      updated_at timestamptz not null default now()
    );
  `);

  await p.query(`
    create table if not exists policy_state (
      chat_id text primary key,
      last_sent_at_ms bigint not null default 0
    );
  `);

  await p.query(`
    create table if not exists message_hash_window (
      id bigserial primary key,
      chat_id text not null,
      hash text not null,
      created_at timestamptz not null default now()
    );
  `);

  await p.query(`
    create index if not exists idx_hash_chat_created on message_hash_window(chat_id, created_at desc);
  `);

  await p.query(`
    create table if not exists webhook_queue (
      id bigserial primary key,
      source text not null,
      payload jsonb not null,
      created_at timestamptz not null default now()
    );
  `);
}

export async function closeDb(): Promise<void> {
  if (pool) await pool.end();
  pool = null;
}
