# OpenClaw Tool Wrapper

This project can be wired as an OpenClaw external tool by invoking the CLI:

- `tg-relay read --chat <id> --limit <n>`
- `tg-relay unread --chat <id> --limit <n>`
- `tg-relay send --chat <id> --text "..."`

All credentials come from env vars (`TG_API_ID`, `TG_API_HASH`, etc).

## Suggested OpenClaw wrapper commands

- read latest: `docker run --rm --env-file .env tg-relay read --chat "$CHAT" --limit "$LIMIT"`
- read unread: `docker run --rm --env-file .env tg-relay unread --chat "$CHAT" --limit "$LIMIT"`
- send: `docker run --rm --env-file .env tg-relay send --chat "$CHAT" --text "$TEXT"`
