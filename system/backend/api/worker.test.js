import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.js';
import { analyze } from './analysis.js';

const env = {
  SUPABASE_URL: 'https://project.example',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
  GROQ_API_KEY: 'test-groq-key',
  TAVILY_API_KEY: 'test-tavily-key',
  ALLOWED_ORIGINS: 'http://localhost:3000',
};
const id = 'e55a346a-0500-4f20-8cb1-53d99d81923d';
const token = { authorization: 'Bearer user-jwt' };
const googleUser = { id, app_metadata: { provider: 'google', providers: ['google'] } };
const postText = text => new Request('https://worker.example/analises', {
  method: 'POST',
  headers: { ...token, 'content-type': 'application/json' },
  body: JSON.stringify({ texto: text }),
});
const transcribedText = 'Uma afirmação extraída.';

test('preserva a quebra de linha original e rejeita afirmações parafraseadas', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    if (new URL(url).hostname === 'api.tavily.com') {
      return Response.json({ results: [{ title: 'Fonte', url: 'https://fonte.example/', content: 'Texto de apoio.' }] });
    }
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
      indicios_ia: null, limitacao: null, afirmacoes: [
        { texto: 'Uma frase em duas linhas.', classificacao: 'sustentada', justificativa: 'Fonte.', fontes: [1] },
        { texto: 'Uma frase inventada.', classificacao: 'sustentada', justificativa: 'Fonte.', fontes: [1] },
      ],
    }) } }] });
  });
  const result = await analyze(env, { text: 'Uma frase em\nduas linhas.' });
  assert.equal(result.afirmacoes[0].texto, 'Uma frase em\nduas linhas.');
  assert.equal(result.afirmacoes.length, 1);
  assert.match(result.limitacao, /não puderam ser vinculadas/);
});

test('exige uma sessão e valida a origem antes de consultar serviços', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 401 }));
  const missing = await worker.fetch(new Request('https://worker.example/analises'), env);
  assert.equal(missing.status, 401);
  const wrongOrigin = await worker.fetch(new Request('https://worker.example/analises', {
    headers: { origin: 'https://other.example' },
  }), env);
  assert.equal(wrongOrigin.status, 403);
  assert.equal(fetchMock.mock.callCount(), 0);
  const expired = await worker.fetch(postText('Conteúdo'), env);
  assert.equal(expired.status, 401);
  assert.equal(fetchMock.mock.callCount(), 1);
  fetchMock.mock.mockImplementation(async () => Response.json({
    id, app_metadata: { provider: 'github', providers: 'not-google-or-email' },
  }));
  const otherProvider = await worker.fetch(postText('Conteúdo'), env);
  assert.equal(otherProvider.status, 403);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('permite histórico com sessão de e-mail e rejeita sessão anônima', async t => {
  let anonymous = false;
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.headers.authorization, token.authorization);
    if (new URL(url).pathname === '/auth/v1/user') {
      return Response.json({ id, app_metadata: { provider: 'email' }, is_anonymous: anonymous });
    }
    return Response.json([{ id }]);
  });
  const request = new Request('https://worker.example/analises', { headers: token });
  const history = await worker.fetch(request, env);
  assert.equal(history.status, 200);
  assert.deepEqual(await history.json(), [{ id }]);

  anonymous = true;
  const denied = await worker.fetch(request, env);
  assert.equal(denied.status, 403);
  assert.equal(fetchMock.mock.callCount(), 3);
});

test('analisa texto e imagem, vincula fontes verificáveis e salva o relatório', async t => {
  const expectedParts = [
    { text: 'Texto enviado.' },
    { inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } },
  ];
  let saved = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const { hostname, pathname } = new URL(url);
    assert.equal(options.redirect, 'manual');
    if (hostname === 'api.tavily.com') {
      assert.equal(options.headers.authorization, `Bearer ${env.TAVILY_API_KEY}`);
      return Response.json({ results: [{ title: 'Fonte', url: 'https://fonte.example/', content: 'A fonte confirma a afirmação.' }] });
    }
    if (hostname === 'api.groq.com') {
      assert.equal(options.headers.authorization, `Bearer ${env.GROQ_API_KEY}`);
      const request = JSON.parse(options.body);
      if (saved === 1 && request.model === 'qwen/qwen3.8-27b') {
        assert.ok(request.messages[1].content[1].image_url.url.endsWith(expectedParts[1].inlineData.data));
        return Response.json({ choices: [{ finish_reason: 'stop', message: { content: transcribedText } }] });
      }
      const input = saved ? transcribedText : expectedParts[0].text;
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
        indicios_ia: null, limitacao: null, afirmacoes: [
          { texto: input, classificacao: 'sustentada', justificativa: 'A fonte confirma a afirmação.', fontes: [1] },
          { texto: input, classificacao: 'contradita', justificativa: 'Resposta sem citação.', fontes: [99] },
          { texto: 'A fonte confirma a afirmação.', classificacao: 'sustentada', justificativa: 'Trecho da fonte.', fontes: [1] },
        ],
      }) } }] });
    }
    assert.equal(options.headers.authorization, token.authorization);
    if (pathname === '/auth/v1/user') return Response.json(googleUser);
    assert.equal(pathname, '/rest/v1/rpc/salvar_analise');
    const { relatorio } = JSON.parse(options.body);
    assert.equal(relatorio.texto_analisado, saved ? transcribedText : 'Texto enviado.');
    assert.deepEqual(relatorio.fontes, [{ titulo: 'Fonte', url: 'https://fonte.example/' }]);
    assert.equal(relatorio.afirmacoes.length, 2);
    assert.deepEqual(relatorio.afirmacoes[0].fontes, [1]);
    assert.equal(relatorio.afirmacoes[1].classificacao, 'inconclusiva');
    assert.ok(!options.body.includes('iVBORw0KGgo='));
    saved++;
    return Response.json(id);
  });

  const invalid = await worker.fetch(postText('   '), env);
  assert.equal(invalid.status, 400);
  const text = await worker.fetch(postText('Texto enviado.'), env);
  assert.equal(text.status, 201);
  assert.equal((await text.json()).id, id);
  const form = new FormData();
  form.set('imagem', new File([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], 'print.png', { type: 'image/png' }));
  const image = await worker.fetch(new Request('https://worker.example/analises', {
    method: 'POST', headers: token, body: form,
  }), env);
  assert.equal(image.status, 201);
  assert.equal(saved, 2);
});

test('consulta e exclui análises pelo token do usuário', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const { pathname, searchParams } = new URL(url);
    assert.equal(options.headers.authorization, token.authorization);
    if (pathname === '/auth/v1/user') return Response.json(googleUser);
    if (!searchParams.has('id')) {
      assert.equal(searchParams.get('limit'), '20');
      assert.equal(searchParams.get('offset'), '20');
      return Response.json([{ id }]);
    }
    assert.equal(searchParams.get('id'), `eq.${id}`);
    if (options.method === 'DELETE') return Response.json([{ id }]);
    return Response.json([{ id, afirmacoes: [{
      ordem: 1, texto: 'Afirmação', afirmacao_fontes: [{ fonte_ordem: 2 }],
    }], fontes: [{ ordem: 2, titulo: 'Fonte' }] }]);
  });
  const url = 'https://worker.example/analises';
  const list = await worker.fetch(new Request(`${url}?offset=20`, { headers: token }), env);
  assert.deepEqual(await list.json(), [{ id }]);
  const item = await worker.fetch(new Request(`${url}/${id}`, { headers: token }), env);
  assert.deepEqual((await item.json()).afirmacoes[0].fontes, [2]);
  const deletion = await worker.fetch(new Request(`${url}/${id}`, { method: 'DELETE', headers: token }), env);
  assert.equal(deletion.status, 204);
});

test('exige as duas chaves de análise e mantém o histórico disponível sem elas', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(new URL(url).origin, env.SUPABASE_URL);
    return Response.json(new URL(url).pathname === '/auth/v1/user' ? googleUser : []);
  });
  for (const key of ['GROQ_API_KEY', 'TAVILY_API_KEY']) {
    const response = await worker.fetch(postText('Texto enviado.'), { ...env, [key]: '' });
    assert.equal(response.status, 503);
  }
  assert.equal(fetchMock.mock.callCount(), 0);
  const history = await worker.fetch(new Request('https://worker.example/analises', { headers: token }), {
    ...env, GROQ_API_KEY: '', TAVILY_API_KEY: '',
  });
  assert.equal(history.status, 200);
  assert.deepEqual(await history.json(), []);
});

test('ignora fontes inválidas e dispensa a Groq quando não há evidências', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(new URL(url).hostname, 'api.tavily.com');
    return Response.json({ results: [
      null,
      { url: 'https://user:password@source.test/', content: 'Trecho.' },
      { url: 'file:///arquivo.txt', content: 'Trecho.' },
    ] });
  });
  const report = await analyze(env, { text: 'Uma afirmação.' });
  assert.deepEqual(report.fontes, []);
  assert.deepEqual(report.afirmacoes, []);
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('expõe Retry-After e preserva CORS e no-store em erros da Groq', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    switch (new URL(url).hostname) {
      case 'project.example': return Response.json(googleUser);
      case 'api.tavily.com': return Response.json({ results: [{ url: 'https://source.test/', content: 'Trecho.' }] });
      case 'api.groq.com': return new Response(null, { status: 429, headers: { 'retry-after': '12' } });
      default: throw new Error('Chamada externa inesperada.');
    }
  });
  const request = postText('Uma afirmação.');
  request.headers.set('origin', env.ALLOWED_ORIGINS);
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '12');
  assert.equal(response.headers.get('access-control-expose-headers'), 'Retry-After');
  assert.equal(response.headers.get('access-control-allow-origin'), env.ALLOWED_ORIGINS);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match((await response.json()).erro, /12 segundos/);
});
