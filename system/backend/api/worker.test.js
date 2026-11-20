import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.js';

const env = {
  SUPABASE_URL: 'https://project.example',
  SUPABASE_PUBLISHABLE_KEY: 'test-key',
  GEMINI_API_KEY: 'test-key',
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
const grounded = {
  texto_analisado: 'Uma afirmação extraída.',
  indicios_ia: null,
  limitacao: null,
  afirmacoes: [
    { texto: 'Primeira afirmação.', classificacao: 'sustentada', justificativa: 'A fonte confirma a afirmação.' },
    { texto: 'Outra afirmação.', classificacao: 'contradita', justificativa: 'Resposta sem citação.' },
  ],
};

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
  fetchMock.mock.mockImplementation(async () => Response.json({ id, app_metadata: { provider: 'email' } }));
  const otherProvider = await worker.fetch(postText('Conteúdo'), env);
  assert.equal(otherProvider.status, 403);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('analisa texto e imagem, vincula fontes verificáveis e salva o relatório', async t => {
  const expectedParts = [
    { text: 'Texto enviado.' },
    { inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } },
  ];
  let saved = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const { hostname, pathname } = new URL(url);
    if (hostname === 'generativelanguage.googleapis.com') {
      assert.match(pathname, /gemini-3\.5-flash:generateContent$/);
      const request = JSON.parse(options.body);
      assert.deepEqual(request.tools, [{ googleSearch: {} }]);
      assert.deepEqual(request.contents[0].parts, [expectedParts[saved]]);
      return Response.json({ candidates: [{
        content: { parts: [{ text: JSON.stringify(grounded) }] },
        groundingMetadata: {
          groundingChunks: [{ web: { title: 'Fonte', uri: 'https://fonte.example/' } }],
          groundingSupports: [{ segment: { text: grounded.afirmacoes[0].justificativa }, groundingChunkIndices: [0] }],
        },
      }] });
    }
    assert.equal(options.headers.authorization, token.authorization);
    if (pathname === '/auth/v1/user') return Response.json(googleUser);
    assert.equal(pathname, '/rest/v1/rpc/salvar_analise');
    const { relatorio } = JSON.parse(options.body);
    assert.equal(relatorio.texto_analisado, saved ? grounded.texto_analisado : 'Texto enviado.');
    assert.deepEqual(relatorio.fontes, [{ titulo: 'Fonte', url: 'https://fonte.example/' }]);
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
