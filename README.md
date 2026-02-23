# telegram-account-relay-tool

TypeScript CLI + Docker skeleton for a Telegram user-account relay.

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm build
pnpm start -- health
```

## Docker

```bash
docker build -t tg-relay .
docker run --rm --env-file .env tg-relay health
```

## Security

- Never commit real API credentials
- Use env vars only

## Auth (Telegram user account)

```bash
npm run build
node dist/cli.js auth:login
node dist/cli.js auth:status
```

Session string is persisted at `TG_SESSION_PATH` (default `/data/telegram.session`).

## Message commands

```bash
node dist/cli.js read --chat -1001234567890 --limit 20
node dist/cli.js unread --chat -1001234567890 --limit 50
node dist/cli.js send --chat -1001234567890 --text "hello"
```
