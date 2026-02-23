# telegram-account-relay-tool

Public TypeScript + Docker CLI for Telegram **user-account relay**.

> Purpose: enable assistant runtimes to read/send messages as a Telegram user session (MTProto), with loop prevention and safe env-based configuration.

## Features

- User-account auth (`auth:login`, `auth:status`)
- Read latest messages (`read`)
- Read unread since checkpoint (`unread`)
- Send message (`send`)
- OpenClaw wrapper mode (`openclaw --payload ...`)
- Loop prevention:
  - duplicate hash window
  - per-chat cooldown

## Architecture

- `src/auth.ts` — login/session persistence
- `src/telegram-client.ts` — Telegram client bootstrap
- `src/messages.ts` — read/unread/send operations
- `src/checkpoint.ts` — unread checkpoint storage
- `src/policy.ts` — anti-loop gates
- `src/openclaw.ts` — OpenClaw wrapper adapter
- `src/cli.ts` — yargs command interface

## Environment variables

See `.env.example`.

Required:

- `TG_API_ID`
- `TG_API_HASH`

Optional:

- `TG_SESSION_PATH` (default `/data/telegram.session`)
- `TG_DEFAULT_CHAT_ID`
- `TG_CHECKPOINT_PATH` (default `/data/checkpoint.json`)
- `TG_POLICY_STATE_PATH` (default `/data/policy-state.json`)
- `TG_SEND_COOLDOWN_MS` (default `2500`)
- `TG_HASH_WINDOW` (default `50`)

## Local usage

```bash
npm install
npm run build

# health
node dist/cli.js health
# init database tables
node dist/cli.js db:migrate

# login
node dist/cli.js auth:login
node dist/cli.js auth:status

# read/send
node dist/cli.js read --chat -1001234567890 --limit 20
node dist/cli.js unread --chat -1001234567890 --limit 50
node dist/cli.js send --chat -1001234567890 --text "hello"
```

## Docker usage

```bash
docker build -t tg-relay .

docker run --rm \
  -v $(pwd)/data:/data \
  --env-file .env \
  tg-relay auth:status

docker run --rm \
  -v $(pwd)/data:/data \
  --env-file .env \
  tg-relay read --chat -1001234567890 --limit 20
```

## OpenClaw wrapper mode

```bash
node dist/cli.js openclaw --payload '{"action":"read","chat":"-100123","limit":10}'
node dist/cli.js openclaw --payload '{"action":"unread","chat":"-100123","limit":50}'
node dist/cli.js openclaw --payload '{"action":"send","chat":"-100123","text":"hello"}'
```

## Security / privacy notes

- Never commit real credentials
- Keep `.env` local only
- Persist session/checkpoints in mounted volume (`/data`)
- Use dedicated Telegram account for automation when possible
- Add your own policy filters before autonomous replying in production

## Next steps

- add richer message normalization (sender tags / media)
- add dry-run simulation mode
- add structured policy hooks (regex allow/deny)
- add CI pipeline + tests

## Cursor commands (unread tracking)

```bash
node dist/cli.js cursor:show --chat -1001234567890
node dist/cli.js cursor:reset --chat -1001234567890
```

Unread tracking now stores per-chat cursor metadata:
- `lastMessageId`
- `lastTimestamp`
- `lastRunAt`

## Webhook receiver mode

```bash
node dist/cli.js webhook:serve
node dist/cli.js queue:consume --limit 20
```

Use this mode to ingest external updates in near real-time and process unread queue entries later.
