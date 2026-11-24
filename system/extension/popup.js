const $ = id => document.getElementById(id);
const maxText = 20_000;
let pendingText = "";
let busy = false;
let reportId;

const labels = {
  sustentada: "Sustentada",
  contradita: "Contradita",
  mista: "Evidências mistas",
  inconclusiva: "Inconclusiva",
};

async function auth(type) {
  const reply = await chrome.runtime.sendMessage({ type });
  if (reply.error) throw new Error(reply.error);
  return reply.data;
}

function showSession(signedIn) {
  $("access").hidden = signedIn;
  $("workspace").hidden = !signedIn;
  $("logout").hidden = !signedIn;
  if (!signedIn) {
    clearPreview();
    $("result").hidden = true;
    $("report").replaceChildren();
    $("records").replaceChildren();
    reportId = undefined;
  }
}

async function run(status, action) {
  if (busy) return;
  busy = true;
  $("status").textContent = status;
  $("error").textContent = "";
  document.querySelectorAll("button").forEach(button => { button.disabled = true; });
  try {
    await action();
  } catch (error) {
    $("error").textContent = error instanceof TypeError ? "Falha de conexão. Tente novamente."
      : error.name === "TimeoutError" ? "A solicitação demorou demais. Tente novamente."
      : error.message || "Não foi possível concluir a ação.";
  } finally {
    busy = false;
    $("status").textContent = "";
    document.querySelectorAll("button").forEach(button => { button.disabled = false; });
  }
}

async function request(path, options = {}) {
  const token = await auth("session");
  if (!token) {
    showSession(false);
    throw new Error("Sua sessão expirou. Entre com Google novamente.");
  }
  const response = await fetch(new URL(path, API_URL), {
    ...options,
    headers: { ...options.headers, authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(75_000),
  });
  if (response.status === 401) throw new Error("Sua sessão expirou. Saia e entre novamente.");
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.erro === "string" ? body.erro : "A API não respondeu como esperado.");
  }
  return response.status === 204 ? undefined : response.json();
}

function clearPreview() {
  pendingText = "";
  $("text").textContent = "";
  $("preview").hidden = true;
}

async function readTab() {
  clearPreview();
  let text;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:\/\//i.test(tab.url || "")) throw new Error();
    const [frame] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: limit => (document.body?.innerText || "").trim().slice(0, limit + 1),
      args: [maxText],
    });
    text = frame.result;
  } catch {
    throw new Error("O Chrome não permitiu a leitura desta aba. Abra uma página comum da web.");
  }
  if (!text) throw new Error("A aba não contém texto legível.");
  if (text.length > maxText) throw new Error("O texto da aba ultrapassa 20.000 caracteres.");
  pendingText = text;
  $("text").textContent = text;
  $("preview").hidden = false;
  $("preview").querySelector("h2").focus();
}

function element(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, onClick) {
  const node = element("button", label);
  node.addEventListener("click", onClick);
  return node;
}

function showReport(report) {
  reportId = report.id;
  const body = $("report");
  body.replaceChildren();
  if (report.texto_analisado) {
    const details = element("details");
    details.append(element("summary", "Texto analisado"), element("pre", report.texto_analisado));
    body.append(details);
  }
  if (report.limitacao) {
    const limitation = element("p", report.limitacao);
    limitation.className = "muted";
    body.append(limitation);
  }
  if (!report.afirmacoes.length) body.append(element("p", "Nenhuma afirmação verificável foi identificada."));
  for (const claim of report.afirmacoes) {
    const article = element("article");
    const verdict = element("strong", labels[claim.classificacao]);
    verdict.className = "verdict";
    verdict.dataset.verdict = claim.classificacao;
    article.append(element("h3", claim.texto), verdict, element("p", claim.justificativa));
    const references = claim.fontes.filter(number => report.fontes[number - 1]);
    if (references.length) {
      const citations = element("p", "Fontes: ");
      for (const number of references) {
        const link = element("a", number);
        link.className = "reference";
        link.href = `#source-${number}`;
        link.setAttribute("aria-label", `Fonte ${number}`);
        citations.append(link);
      }
      article.append(citations);
    }
    body.append(article);
  }
  const sourcesSection = element("section");
  sourcesSection.className = "report-sources";
  sourcesSection.append(element("h3", "Fontes"));
  if (report.fontes.length) {
    const sources = element("ol");
    for (const [index, source] of report.fontes.entries()) {
      const item = element("li");
      item.id = `source-${index + 1}`;
      item.tabIndex = -1;
      const url = URL.canParse(source.url) && new URL(source.url);
      if (url && ["http:", "https:"].includes(url.protocol)) {
        const link = element("a", source.titulo);
        link.href = url.href;
        link.target = "_blank";
        link.rel = "noreferrer";
        item.append(link);
      } else item.textContent = source.titulo;
      sources.append(item);
    }
    sourcesSection.append(sources);
  } else {
    const empty = element("p", "Nenhuma fonte disponível para este relatório.");
    empty.className = "muted";
    sourcesSection.append(empty);
  }
  if (report.sugestoes_google) {
    const frame = element("iframe");
    frame.title = "Sugestões de pesquisa do Google";
    frame.setAttribute("sandbox", "allow-popups allow-popups-to-escape-sandbox");
    frame.referrerPolicy = "no-referrer";
    frame.srcdoc = '<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data: https:; base-uri \'none\'; form-action \'none\'"><base target="_blank">' + report.sugestoes_google;
    sourcesSection.append(frame);
  }
  body.append(sourcesSection);
  const authorship = element("div");
  authorship.className = "authorship";
  authorship.append(element("h3", "Indícios de conteúdo gerado por IA"),
    element("p", report.indicios_ia || "O relatório não apontou indícios."),
    element("p", "Indícios não confirmam a autoria do conteúdo."));
  body.append(authorship);
  $("result").hidden = false;
  $("result").querySelector("h2").focus();
}

async function loadHistory(offset = 0) {
  const rows = await request(`/analises?offset=${offset}`);
  const records = $("records");
  records.replaceChildren();
  if (!rows.length) records.append(element("p", offset ? "Fim do histórico." : "Você ainda não tem análises."));
  const list = element("ul");
  for (const item of rows) {
    const id = encodeURIComponent(item.id);
    const row = element("li");
    const text = item.texto_analisado.trim();
    row.append(element("p", text ? text.slice(0, 120) + (text.length > 120 ? "…" : "") : "Análise de print"),
      element("small", new Date(item.criada_em).toLocaleString("pt-BR")),
      button("Ver análise", () => run("Carregando análise…", async () => showReport(await request(`/analises/${id}`)))));
    const remove = button("Excluir", () => {
      if (busy) return;
      remove.hidden = true;
      confirmation.hidden = false;
      confirm.focus();
    });
    const confirmation = element("div");
    confirmation.className = "actions";
    confirmation.hidden = true;
    const confirm = button("Confirmar exclusão", () => run("Excluindo análise…", async () => {
      await request(`/analises/${id}`, { method: "DELETE" });
      if (reportId === item.id) {
        $("result").hidden = true;
        $("report").replaceChildren();
        reportId = undefined;
      }
      row.remove();
      if (!list.childElementCount) records.prepend(element("p", "Nenhuma análise nesta página."));
      $("history-title").focus();
    }));
    confirm.classList.add("danger");
    confirmation.append(confirm, button("Cancelar", () => {
      confirmation.hidden = true;
      remove.hidden = false;
      remove.focus();
    }));
    row.append(remove, confirmation);
    list.append(row);
  }
  if (rows.length) records.append(list);
  if (offset) records.append(button("Anterior", () => run("Carregando histórico…", () => loadHistory(offset - 20))));
  if (rows.length === 20) records.append(button("Próxima", () => run("Carregando histórico…", () => loadHistory(offset + 20))));
}

$("login").onclick = () => run("Abrindo login Google…", async () => showSession(Boolean(await auth("login"))));
$("logout").onclick = () => run("Encerrando sessão…", async () => { await auth("logout"); showSession(false); });
$("read").onclick = () => run("Lendo a aba…", readTab);
$("cancel").onclick = () => { clearPreview(); $("read").focus(); };
$("submit").onclick = () => {
  if (!pendingText) return;
  void run("Analisando texto…", async () => {
    const report = await request("/analises", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ texto: pendingText }),
    });
    clearPreview();
    $("records").replaceChildren();
    showReport(report);
  });
};
$("history").onclick = () => run("Carregando histórico…", () => loadHistory());
void run("Verificando sessão…", async () => {
  try { showSession(Boolean(await auth("session"))); }
  catch (error) { showSession(false); throw error; }
});
