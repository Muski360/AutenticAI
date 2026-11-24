import assert from 'node:assert/strict';

const api = 'http://127.0.0.1:8787';
const { ALLOWED_ORIGINS, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
const origin = ALLOWED_ORIGINS?.split(',').map(value => value.trim()).find(Boolean);

assert.ok(origin, 'Defina ALLOWED_ORIGINS no .env.');
assert.ok(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY, 'Configure o Supabase no .env.');

function request(url, options) {
  return fetch(url, { signal: AbortSignal.timeout(15_000), ...options });
}

const health = await request(`${api}/health`);
assert.equal(health.status, 200, 'O Worker local deve responder em /health.');
assert.deepEqual(await health.json(), { status: 'ok' });

const preflight = await request(`${api}/analises`, {
  method: 'OPTIONS',
  headers: { origin, 'access-control-request-method': 'POST' },
});
assert.equal(preflight.status, 204, 'O Worker deve aceitar o preflight da origem configurada.');
assert.equal(preflight.headers.get('access-control-allow-origin'), origin);

const anonymous = await request(`${api}/analises`);
assert.equal(anonymous.status, 401, 'O histórico deve exigir autenticação.');

const invalid = await request(`${api}/analises`, {
  headers: { authorization: 'Bearer autenticai-invalid-smoke-token' },
});
assert.equal(invalid.status, 401, 'O Worker deve rejeitar um token inválido no Supabase.');

const settings = await request(new URL('/auth/v1/settings', SUPABASE_URL), {
  headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
});
assert.equal(settings.status, 200, 'O Supabase deve responder com a chave publicável configurada.');
const { external } = await settings.json();

console.log('Worker e Supabase passaram na verificação básica.');
console.log(`Login Google no Supabase: ${external?.google ? 'habilitado' : 'desabilitado'}.`);
