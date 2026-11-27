export const maxText = 20_000;
export const historyPageSize = 20;

/** @param {string} value */
export function historyTitleText(value) {
  const text = value.trim();
  if (!text) return "Análise de print";
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

/**
 * @template T
 * @param {string} api
 * @param {string} token
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<T>}
 */
export async function requestAnalysis(api, token, path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set("authorization", `Bearer ${token}`);
  // A análise de um print pode usar quatro chamadas externas antes de salvar.
  const timeout = options.method === "POST" ? 135_000 : 25_000;
  const response = await fetch(new URL(path, api), {
    ...options, headers, signal: AbortSignal.timeout(timeout),
  });
  if (response.status === 401) throw new Error("Sua sessão expirou. Saia e entre novamente.");
  if (response.status === 204) return /** @type {T} */ (/** @type {unknown} */ (undefined));
  const body = await response.json().catch(error => {
    if (error instanceof SyntaxError) return null;
    throw error;
  });
  if (!response.ok) {
    throw new Error(typeof body?.erro === "string" ? body.erro : "Não foi possível concluir a solicitação.");
  }
  if (!body || typeof body !== "object") throw new Error("A API retornou uma resposta inválida.");
  return body;
}

/** @param {string} value */
export function sourceUrl(value) {
  try {
    const url = new URL(value);
    if (["http:", "https:"].includes(url.protocol) && !url.username && !url.password) return url.href;
  } catch {
    // Relatórios antigos podem conter endereços inválidos.
  }
  return null;
}
