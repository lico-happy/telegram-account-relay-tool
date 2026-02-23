#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { loadConfig } from './config.js';
import { authLogin, authStatus } from './auth.js';
import { readLatest, readUnread, sendMessage } from './messages.js';
import { loadCheckpoint, resetCursor } from './checkpoint.js';
import { runOpenClawTool } from './openclaw.js';
import { runWebhookServer, consumeWebhookQueue } from './webhook.js';

async function main() {
  await yargs(hideBin(process.argv))
    .scriptName('tg-relay')
    .command('health', 'Check config/env health', {}, () => {
      const cfg = loadConfig();
      console.log(JSON.stringify({ ok: true, sessionPath: cfg.sessionPath }, null, 2));
    })
    .command('auth:login', 'Interactive Telegram user login', {}, async () => authLogin())
    .command('auth:status', 'Check if session exists', {}, async () => authStatus())
    .command('read', 'Read latest messages', (y) => y.option('chat', { type: 'string', demandOption: true }).option('limit', { type: 'number', default: 20 }), async (a) => readLatest(String(a.chat), Number(a.limit)))
    .command('unread', 'Read unread since checkpoint', (y) => y.option('chat', { type: 'string', demandOption: true }).option('limit', { type: 'number', default: 50 }), async (a) => readUnread(String(a.chat), Number(a.limit)))
    .command('send', 'Send message', (y) => y.option('chat', { type: 'string', demandOption: true }).option('text', { type: 'string', demandOption: true }), async (a) => sendMessage(String(a.chat), String(a.text)))
    .command('cursor:show', 'Show cursor for a chat', (y)=> y.option('chat',{type:'string', demandOption:true}), async (a)=> { const cp=loadCheckpoint(); console.log(JSON.stringify({ok:true, chat:String(a.chat), cursor:cp[String(a.chat)] ?? null}, null, 2)); })
    .command('cursor:reset', 'Reset cursor for a chat', (y)=> y.option('chat',{type:'string', demandOption:true}), async (a)=> { resetCursor(String(a.chat)); console.log(JSON.stringify({ok:true, chat:String(a.chat), reset:true}, null, 2)); })
    .command('openclaw', 'OpenClaw wrapper mode (JSON payload)', (y) => y.option('payload', { type: 'string', demandOption: true }), async (a) => runOpenClawTool(String(a.payload)))
    .command('webhook:serve', 'Run webhook receiver server', {}, async () => runWebhookServer())
    .command('queue:consume', 'Consume queued webhook items', (y)=> y.option('limit',{type:'number', default:20}), async (a)=> consumeWebhookQueue(Number(a.limit)))
    .demandCommand(1)
    .strict()
    .help()
    .parseAsync();
}

main();
