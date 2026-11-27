import { analyze, ProviderError } from './analysis.js';
import { InputError, readInput } from './input.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SUMMARY = 'id,criada_em,texto_analisado,indicios_ia,limitacao';
const DETAILS = SUMMARY + ',afirmacoes(ordem,texto,classificacao,justificativa,afirmacao_fontes(fonte_ordem)),fontes(ordem,titulo,url)';
const LOGIN_PROVIDERS = ['google', 'email'];

export default {
  async fetch(request, env) {
    const headers = { 'cache-control': 'no-store', vary: 'Origin' };
    const json = (value, status = 200, extraHeaders) => Response.json(value, {
      status, headers: { ...headers, ...extraHeaders },
    });
    const fail = (erro, status, extraHeaders) => json({ erro }, status, extraHeaders);
    const origin = request.headers.get('origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim());
    if (origin && !allowed.includes(origin)) {
      return fail('Origem não autorizada.', 403);
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

    const url = new URL(request.url);
    const { pathname } = url;
    if (request.method === 'GET' && pathname === '/health') return json({ status: 'ok' });
    const item = pathname.match(/^\/analises\/([^/]+)$/);
    if (pathname !== '/analises' && !item) return fail('Rota não encontrada.', 404);
    const methods = item ? ['GET', 'DELETE'] : ['GET', 'POST'];
    if (!methods.includes(request.method)) {
      return fail('Método não permitido.', 405, { allow: methods.join(', ') });
    }
    if (item && !UUID.test(item[1])) return fail('ID de análise inválido.', 400);

    const authorization = request.headers.get('authorization');
    if (!/^Bearer \S+$/i.test(authorization ?? '')) return fail('Entre com sua conta para continuar.', 401);
    if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
      return fail('A API ainda precisa das credenciais do Supabase.', 503);
    }
    if (request.method === 'POST' && (!env.GROQ_API_KEY?.trim() || !env.TAVILY_API_KEY?.trim())) {
      return fail('Configure as chaves da Groq e da Tavily no backend para fazer análises.', 503);
    }

    const supabase = (path, options = {}) => fetch(new URL(path, env.SUPABASE_URL), {
      ...options,
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization, ...options.headers },
    });
    try {
      const session = await supabase('/auth/v1/user');
      if ([401, 403].includes(session.status)) return fail('Sessão inválida ou expirada.', 401);
      if (!session.ok) return fail('O Supabase não conseguiu validar a sessão.', 502);
      const { app_metadata, is_anonymous } = await session.json();
      const providers = Array.isArray(app_metadata?.providers) ? app_metadata.providers : [];
      if (is_anonymous || !LOGIN_PROVIDERS.some(provider =>
        provider === app_metadata?.provider || providers.includes(provider))) {
        return fail('Entre com Google ou e-mail para continuar.', 403);
      }

      if (request.method === 'POST') {
        const input = await readInput(request);
        const report = await analyze(env, input);
        const saved = await supabase('/rest/v1/rpc/salvar_analise', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ relatorio: report }),
        });
        if (!saved.ok) return fail('Não foi possível salvar a análise.', 502);
        return json({ id: await saved.json(), ...report }, 201);
      }

      const params = new URLSearchParams();
      if (item) params.set('id', `eq.${item[1]}`);
      if (request.method === 'DELETE') {
        params.set('select', 'id');
        const deleted = await supabase(`/rest/v1/analises?${params}`, {
          method: 'DELETE',
          headers: { prefer: 'return=representation' },
        });
        if (!deleted.ok) return fail('Não foi possível excluir a análise.', 502);
        if (!(await deleted.json()).length) return fail('Análise não encontrada.', 404);
        return new Response(null, { status: 204, headers });
      }

      params.set('select', item ? DETAILS : SUMMARY);
      if (item) {
        params.set('afirmacoes.order', 'ordem');
        params.set('fontes.order', 'ordem');
      } else {
        const offset = url.searchParams.get('offset') ?? '0';
        if (!/^\d{1,8}$/.test(offset)) return fail('Offset inválido.', 400);
        params.set('order', 'criada_em.desc,id.desc');
        params.set('limit', '20');
        params.set('offset', offset);
      }
      const response = await supabase(`/rest/v1/analises?${params}`);
      if (!response.ok) return fail('Não foi possível consultar o histórico.', 502);
      const rows = await response.json();
      if (!item) return json(rows);
      const row = rows[0];
      if (!row) return fail('Análise não encontrada.', 404);
      return json({
        ...row,
        afirmacoes: row.afirmacoes.map(({ ordem, afirmacao_fontes, ...claim }) => ({
          ...claim, fontes: afirmacao_fontes.map(link => link.fonte_ordem).sort((a, b) => a - b),
        })),
        fontes: row.fontes.map(({ ordem, ...fonte }) => fonte),
      });
    } catch (error) {
      if (error instanceof ProviderError && error.retryAfter !== null) {
        return fail(error.message, error.status, {
          'retry-after': String(error.retryAfter), 'access-control-expose-headers': 'Retry-After',
        });
      }
      if (error instanceof InputError || error instanceof ProviderError) return fail(error.message, error.status);
      if (error?.name === 'TimeoutError') return fail('O serviço não respondeu a tempo. Tente novamente.', 504);
      return fail('Não foi possível concluir a solicitação.', 502);
    }
  },
};
