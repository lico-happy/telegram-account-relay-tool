#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { loadConfig } from './config.js';
import { authLogin, authStatus } from './auth.js';

async function main() {
  await yargs(hideBin(process.argv))
    .scriptName('tg-relay')
    .command('health', 'Check config/env health', {}, () => {
      const cfg = loadConfig();
      console.log(JSON.stringify({ ok: true, sessionPath: cfg.sessionPath }, null, 2));
    })
    .command('auth:login', 'Interactive Telegram user login', {}, async () => {
      await authLogin();
    })
    .command('auth:status', 'Check if session exists', {}, async () => {
      await authStatus();
    })
    .demandCommand(1)
    .strict()
    .help()
    .parseAsync();
}

main();
