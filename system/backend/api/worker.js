import { analyze, ProviderError } from './analysis.js';

const MAX_TEXT = 20_000;
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_BODY = MAX_IMAGE + 8192;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUMMARY = 'id,criada_em,texto_analisado,indicios_ia,limitacao';
const DETAILS = SUMMARY + ',afirmacoes(ordem,texto,classificacao,justificativa,afirmacao_fontes(fonte_ordem)),fontes(ordem,titulo,url)';

export default {
  async fetch(request, env) {
    const headers = { 'cache-control': 'no-store', vary: 'Origin' };
    const origin = request.headers.get('origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim());
    if (origin && !allowed.includes(origin)) {
      return Response.json({ erro: 'Origem não autorizada.' }, { status: 403, headers });
    }
    if (origin) headers['access-control-allow-origin'] = origin;
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...headers,
          'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
          'access-control-allow-headers': 'Authorization, Content-Type',
        },
      });
    }

    const json = (value, status = 200) => Response.json(value, { status, headers });
    const url = new URL(request.url);
    const { pathname } = url;
    if (request.method === 'GET' && pathname === '/health') return json({ status: 'ok' });
    const item = pathname.match(/^\/analises\/([^/]+)$/);
    if (pathname !== '/analises' && !item) return json({ erro: 'Rota não encontrada.' }, 404);
    const methods = item ? ['GET', 'DELETE'] : ['GET', 'POST'];
    if (!methods.includes(request.method)) {
      return Response.json({ erro: 'Método não permitido.' }, {
        status: 405, headers: { ...headers, allow: methods.join(', ') },
      });
    }
    if (item && !UUID.test(item[1])) return json({ erro: 'ID de análise inválido.' }, 400);

    const authorization = request.headers.get('authorization');
    if (!/^Bearer \S+$/i.test(authorization ?? '')) return json({ erro: 'Entre com sua conta para continuar.' }, 401);
    if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
      return json({ erro: 'A API ainda precisa das credenciais do Supabase.' }, 503);
    }
    if (request.method === 'POST' && (!env.GROQ_API_KEY?.trim() || !env.TAVILY_API_KEY?.trim())) {
      return json({ erro: 'Configure as chaves da Groq e da Tavily no backend para fazer análises.' }, 503);
    }

    const supabase = (path, options = {}) => fetch(new URL(path, env.SUPABASE_URL), {
      ...options,
      signal: AbortSignal.timeout(10_000),
      headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization, ...options.headers },
    });
    try {
      const session = await supabase('/auth/v1/user');
      if ([401, 403].includes(session.status)) return json({ erro: 'Sessão inválida ou expirada.' }, 401);
      if (!session.ok) return json({ erro: 'O Supabase não conseguiu validar a sessão.' }, 502);
      const user = await session.json();
      if (!user.app_metadata?.providers?.includes('google') && user.app_metadata?.provider !== 'google') {
        return json({ erro: 'Entre com uma conta Google para continuar.' }, 403);
      }

      if (request.method === 'POST') {
        const input = await readInput(request);
        const report = await analyze(env, input);
        const saved = await supabase('/rest/v1/rpc/salvar_analise', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ relatorio: report }),
        });
        if (!saved.ok) return json({ erro: 'Não foi possível salvar a análise.' }, 502);
        return json({ id: await saved.json(), ...report }, 201);
      }

      const params = new URLSearchParams();
      if (item) params.set('id', `eq.${item[1]}`);
      if (request.method === 'DELETE') {
        const deleted = await supabase(`/rest/v1/analises?${params}&select=id`, {
          method: 'DELETE',
          headers: { prefer: 'return=representation' },
        });
        if (!deleted.ok) return json({ erro: 'Não foi possível excluir a análise.' }, 502);
        if (!(await deleted.json()).length) return json({ erro: 'Análise não encontrada.' }, 404);
        return new Response(null, { status: 204, headers });
      }

      params.set('select', item ? DETAILS : SUMMARY);
      if (item) {
        params.set('afirmacoes.order', 'ordem');
        params.set('fontes.order', 'ordem');
      } else {
        const offset = url.searchParams.get('offset') ?? '0';
        if (!/^\d{1,8}$/.test(offset)) return json({ erro: 'Offset inválido.' }, 400);
        params.set('order', 'criada_em.desc,id.desc');
        params.set('limit', '20');
        params.set('offset', offset);
      }
      const response = await supabase(`/rest/v1/analises?${params}`);
      if (!response.ok) return json({ erro: 'Não foi possível consultar o histórico.' }, 502);
      const rows = await response.json();
      if (!item) return json(rows);
      const row = rows[0];
      if (!row) return json({ erro: 'Análise não encontrada.' }, 404);
      return json({
        ...row,
        afirmacoes: row.afirmacoes.map(({ ordem, afirmacao_fontes, ...claim }) => ({
          ...claim, fontes: afirmacao_fontes.map(link => link.fonte_ordem).sort((a, b) => a - b),
        })),
        fontes: row.fontes.map(({ ordem, ...fonte }) => fonte),
      });
    } catch (error) {
      if (error instanceof ProviderError && error.retryAfter !== null) {
        return Response.json({ erro: error.message }, { status: error.status, headers: { ...headers, 'retry-after': String(error.retryAfter), 'access-control-expose-headers': 'Retry-After' } });
      }
      if (error instanceof InputError || error instanceof ProviderError) return json({ erro: error.message }, error.status);
      if (error.name === 'TimeoutError') return json({ erro: 'O serviço não respondeu a tempo. Tente novamente.' }, 504);
      return json({ erro: 'Não foi possível concluir a solicitação.' }, 502);
    }
  },
};

class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

async function readInput(request) {
  const type = request.headers.get('content-type') ?? '';
  const isJson = /^application\/json(?:;|$)/i.test(type);
  const isForm = /^multipart\/form-data(?:;|$)/i.test(type);
  if (!isJson && !isForm) throw new InputError('Envie texto em JSON ou um print em multipart/form-data.', 415);
  const limit = isJson ? 128 * 1024 : MAX_BODY;
  if (Number(request.headers.get('content-length')) > limit) throw new InputError('Envio muito grande.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new InputError('Envie texto ou uma imagem.');
  const chunks = [];
  let length = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new InputError('Envio muito grande.', 413);
    }
    chunks.push(value);
  }
  const payload = new Response(new Blob(chunks), { headers: { 'content-type': type } });
  if (isJson) {
    const body = await payload.json().catch(() => null);
    const text = typeof body?.texto === 'string' ? body.texto.trim() : '';
    if (!text || text.length > MAX_TEXT) throw new InputError('Envie um texto de 1 a 20.000 caracteres.');
    return { text };
  }
  const form = await payload.formData().catch(() => null);
  const image = form?.get('imagem');
  if (!(image instanceof File) || !image.size) throw new InputError('Selecione uma imagem.');
  if (image.size > MAX_IMAGE) throw new InputError('A imagem deve ter até 5 MiB.', 413);
  const signature = new Uint8Array(await image.slice(0, 12).arrayBuffer());
  const matches = (bytes, offset = 0) => bytes.every((byte, index) => byte === signature[index + offset]);
  const valid = {
    'image/png': matches([137, 80, 78, 71, 13, 10, 26, 10]),
    'image/jpeg': matches([255, 216, 255]),
    'image/webp': matches([82, 73, 70, 70]) && matches([87, 69, 66, 80], 8),
  };
  if (valid[image.type] !== true) throw new InputError('Envie uma imagem PNG, JPEG ou WebP válida.', 415);
  const bytes = new Uint8Array(await image.arrayBuffer());
  const binary = [];
  for (let i = 0; i < bytes.length; i += 8192) {
    binary.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
  }
  return { inlineData: { mimeType: image.type, data: btoa(binary.join('')) } };
}
