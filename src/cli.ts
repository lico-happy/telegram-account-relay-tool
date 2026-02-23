#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { loadConfig } from './config.js';

function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('tg-relay')
    .command('health', 'Check config/env health', {}, () => {
      const cfg = loadConfig();
      console.log(JSON.stringify({ ok: true, sessionPath: cfg.sessionPath }, null, 2));
    })
    .demandCommand(1)
    .strict()
    .help().argv;

  return argv;
}

main();
