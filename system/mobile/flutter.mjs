import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { androidConfig } from '../client-config.mjs';

const mode = process.argv[2];
if (mode !== 'run' && mode !== 'apk') {
  console.error('Use node flutter.mjs run ou node flutter.mjs apk.');
  process.exit(1);
}

const config = androidConfig();
if (!config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY em system/backend/.env.local.');
}
const args = mode === 'run' ? ['run'] : ['build', 'apk'];
if (mode === 'apk' && config.API_URL.startsWith('http:')) args.push('--debug');

process.chdir(fileURLToPath(new URL('.', import.meta.url)));
mkdirSync('.dart_tool', { recursive: true });
const temp = mkdtempSync('.dart_tool/autenticai-');
const defines = `${temp}/public-config.json`;
try {
  writeFileSync(defines, JSON.stringify(config));
  const flutterArgs = [...args, `--dart-define-from-file=${defines}`];
  const result = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/c', 'flutter', ...flutterArgs], { stdio: 'inherit' })
    : spawnSync('flutter', flutterArgs, { stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(defines, { force: true });
  rmdirSync(temp);
}
