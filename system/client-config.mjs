import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

function readLocalEnv(name) {
  try {
    return parseEnv(readFileSync(new URL(`./backend/${name}`, import.meta.url), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return {};
  }
}

const local = { ...readLocalEnv('.env'), ...readLocalEnv('.env.local') };

export function clientConfig(overrides = {}) {
  const key = overrides.SUPABASE_PUBLISHABLE_KEY ?? local.SUPABASE_PUBLISHABLE_KEY ?? '';
  if (key && !key.startsWith('sb_publishable_')) {
    throw new Error('Use a chave publicável do Supabase (sb_publishable_).');
  }
  return {
    SUPABASE_URL: overrides.SUPABASE_URL ?? local.SUPABASE_URL ?? '',
    SUPABASE_PUBLISHABLE_KEY: key,
    API_URL: overrides.API_URL ?? local.API_URL ?? 'http://localhost:8787',
  };
}

export function androidConfig() {
  const config = clientConfig();
  const api = new URL(local.ANDROID_API_URL || config.API_URL);
  if (!local.ANDROID_API_URL && ['localhost', '127.0.0.1'].includes(api.hostname)) {
    api.hostname = '10.0.2.2';
  }
  return { ...config, API_URL: api.origin };
}
