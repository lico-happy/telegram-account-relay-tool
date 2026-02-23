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
