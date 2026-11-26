import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "./brand";

type Summary = { id: string; criada_em: string; texto_analisado: string };
const classifications = {
  sustentada: "Sustentada",
  contradita: "Contradita",
  mista: "Evidências mistas",
  inconclusiva: "Inconclusiva",
};
type Report = Pick<Summary, "id" | "texto_analisado"> & {
  afirmacoes: { texto: string; classificacao: keyof typeof classifications; justificativa: string; fontes: number[] }[];
  fontes: { titulo: string; url: string }[];
  indicios_ia: string | null;
  limitacao: string | null;
};
type Input = { text: string } | { file: File; url: string };
const pageSize = 20;
const maxText = 20_000;
const maxImage = 5 * 1024 * 1024;
const imageTypes = ["image/png", "image/jpeg", "image/webp"];

export function Workspace({ api, token }: { api: string; token: string }) {
  const [mode, setMode] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<Input>();
  const [report, setReport] = useState<Report>();
  const [history, setHistory] = useState<Summary[]>();
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState("");
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const previewTitle = useRef<HTMLHeadingElement>(null);
  const historyTitle = useRef<HTMLHeadingElement>(null);
  const reviewButton = useRef<HTMLButtonElement>(null);
  const returnToEditor = useRef(false);

  useEffect(() => {
    if (preview) previewTitle.current?.focus();
    if (!preview && returnToEditor.current) {
      returnToEditor.current = false;
      reviewButton.current?.focus();
    }
    if (preview && "url" in preview) return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  useEffect(() => {
    if (report) resultTitle.current?.focus();
  }, [report]);

  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(new URL(path, api), {
      ...options,
      headers: { ...options?.headers, authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(75_000),
    });
    if (res.status === 401) throw new Error("Sua sessão expirou. Saia e entre novamente.");
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(typeof body.erro === "string" ? body.erro : "O serviço não respondeu como esperado.");
    }
    return res.status === 204 ? undefined as T : res.json();
  }

  async function run(message: string, action: () => Promise<void>) {
    setBusy(message);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (error) {
      setError(error instanceof Error && error.name === "TimeoutError"
        ? "A solicitação demorou demais. Tente novamente."
        : error instanceof TypeError
          ? "Não foi possível conectar à API. Verifique a conexão e tente novamente."
          : error instanceof Error ? error.message : "Não foi possível concluir esta ação.");
    } finally {
      setBusy("");
    }
  }

  function review(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (mode === "text") {
      const value = text.trim();
      if (!value || value.length > maxText) {
        setError("Digite um texto de 1 a 20.000 caracteres.");
        return;
      }
      setPreview({ text: value });
    } else {
      if (!file || !file.size || file.size > maxImage || !imageTypes.includes(file.type)) {
        setError("Selecione um print PNG, JPEG ou WebP de até 5 MiB.");
        return;
      }
      setPreview({ file, url: URL.createObjectURL(file) });
    }
  }

  function submit() {
    if (!preview) return;
    void run("Analisando conteúdo…", async () => {
      const options: RequestInit = { method: "POST" };
      if ("text" in preview) {
        options.headers = { "content-type": "application/json" };
        options.body = JSON.stringify({ texto: preview.text });
      } else {
        const data = new FormData();
        data.set("imagem", preview.file);
        options.body = data;
      }
      setReport(await request<Report>("/analises", options));
      setPreview(undefined);
      setText("");
      setFile(undefined);
      setHistory(undefined);
    });
  }

  async function loadHistory(at: number) {
    const rows = await request<Summary[]>(`/analises?offset=${at}`);
    if (!rows.length && at > 0) {
      await loadHistory(at - pageSize);
      return;
    }
    setHistory(rows);
    setOffset(at);
  }

  function remove(id: string) {
    void run("Excluindo análise…", async () => {
      await request<void>(`/analises/${encodeURIComponent(id)}`, { method: "DELETE" });
      setDeleting("");
      setReport(current => current?.id === id ? undefined : current);
      setHistory(undefined);
      setNotice("Análise excluída.");
      historyTitle.current?.focus();
    });
  }

  return (
    <>
      <header className="app-intro" id="new-analysis" tabIndex={-1}>
        <h1>Nova <span>análise</span></h1>
      </header>
      {busy && <p className="feedback progress workspace-feedback" role="status">{busy}</p>}
      {notice && <p className="feedback success workspace-feedback" role="status">{notice}</p>}
      {error && <p className="feedback error workspace-feedback" role="alert">{error}</p>}
      <section className="panel editor" aria-label="Conteúdo para análise">
        {preview ? (
          <>
            <div className="panel-body preview-body">
            <h2 ref={previewTitle} tabIndex={-1}>Revise o conteúdo</h2>
            {"text" in preview
              ? <p className="content preview-text">{preview.text}</p>
              : <Image className="preview" src={preview.url} alt="Print selecionado para análise" width={640} height={480} unoptimized />}
            <p className="guide"><Icon name="lock" /> Ao confirmar, você envia o conteúdo à Groq e à Tavily. O histórico privado guarda o texto e o relatório.</p>
            </div>
            <div className="panel-actions">
              <button type="button" disabled={!!busy} onClick={() => {
                returnToEditor.current = true;
                setPreview(undefined);
              }}>Voltar e editar</button>
              <button className="button dark" type="button" disabled={!!busy} onClick={submit}>Confirmar envio <Icon name="arrow" /></button>
            </div>
          </>
        ) : (
          <form onSubmit={review}>
            <fieldset disabled={!!busy}>
              <legend className="sr-only">O que você quer analisar?</legend>
              <div className="mode-tabs">
                <label><input className="sr-only" type="radio" name="mode" checked={mode === "text"} onChange={() => setMode("text")} /><span><Icon name="file" /> Texto</span></label>
                <label><input className="sr-only" type="radio" name="mode" checked={mode === "image"} onChange={() => setMode("image")} /><span><Icon name="image" /> Print</span></label>
              </div>
              <div className="panel-body">
              {mode === "text" ? (
                <>
                  <label className="field">Texto para análise
                    <textarea value={text} onChange={event => setText(event.target.value)} maxLength={maxText} rows={7} required />
                  </label>
                  <p className="field-note">{text.length.toLocaleString("pt-BR")} / 20.000 caracteres</p>
                </>
              ) : (
                <label className="field upload">
                  <Icon name="image" />
                  <strong>Selecione um print</strong><span>PNG, JPEG ou WebP, até 5 MiB</span>
                  <input type="file" aria-label="Selecione um print" accept={imageTypes.join(",")} onChange={event => setFile(event.target.files?.[0])} />
                  {file && <span className="field-note">{file.name}</span>}
                </label>
              )}
              </div>
              <div className="panel-actions">
                <button className="button dark" ref={reviewButton} type="submit">Revisar conteúdo <Icon name="arrow" /></button>
              </div>
            </fieldset>
          </form>
        )}
      </section>
      {report && (
        <section className="workspace-section" aria-labelledby="result">
          <h2 id="result" ref={resultTitle} tabIndex={-1}>Resultado</h2>
          <ReportBody report={report} />
        </section>
      )}
      <section className="workspace-section" aria-labelledby="history">
        <div className="section-heading">
          <h2 id="history" ref={historyTitle} tabIndex={-1}>Histórico</h2>
          <button type="button" disabled={!!busy} onClick={() => void run("Carregando histórico…", () => loadHistory(0))}>
            <Icon name="clock" /> {history ? "Atualizar histórico" : "Abrir histórico"}
          </button>
        </div>
        {history && <div className="panel history-panel">
        {history?.length === 0 && <p className="empty-state"><Icon name="clock" /> Você ainda não tem análises.</p>}
        {history && history.length > 0 && (
          <ul className="records">
            {history.map(item => (
              <li key={item.id}>
                <div className="record-copy">
                <p>{item.texto_analisado.trim().slice(0, 120) || "Análise de print"}{item.texto_analisado.trim().length > 120 ? "…" : ""}</p>
                <small>{new Date(item.criada_em).toLocaleString("pt-BR")}</small>
                </div>
                <div className="actions">
                  <button type="button" disabled={!!busy} onClick={() => void run("Carregando análise…", async () => {
                    setReport(await request<Report>(`/analises/${encodeURIComponent(item.id)}`));
                  })}>Ver análise</button>
                  {deleting === item.id ? (
                    <>
                      <button className="danger-button" type="button" disabled={!!busy} onClick={() => remove(item.id)}>Confirmar exclusão</button>
                      <button type="button" disabled={!!busy} onClick={() => setDeleting("")}>Cancelar</button>
                    </>
                  ) : <button type="button" disabled={!!busy} onClick={() => setDeleting(item.id)}>Excluir</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {history && (offset > 0 || history.length === pageSize) && (
          <nav className="panel-actions" aria-label="Páginas do histórico">
            <button type="button" disabled={!!busy || offset === 0} onClick={() => void run("Carregando histórico…", () => loadHistory(offset - pageSize))}>Anterior</button>
            <span>Página {offset / pageSize + 1}</span>
            <button type="button" disabled={!!busy || history.length < pageSize} onClick={() => void run("Carregando histórico…", () => loadHistory(offset + pageSize))}>Próxima</button>
          </nav>
        )}
        </div>}
      </section>
    </>
  );
}

function ReportBody({ report }: { report: Report }) {
  return (
    <div className="report-layout">
      <div className="panel panel-body report-claims">
      {report.texto_analisado && <details><summary>Texto analisado</summary><p className="content">{report.texto_analisado}</p></details>}
      {report.limitacao && <p className="feedback warning">{report.limitacao}</p>}
      {report.afirmacoes.length === 0 && <p className="empty-state">Nenhuma afirmação verificável foi identificada.</p>}
      {report.afirmacoes.map((claim, index) => (
        <article className="claim" key={index}>
          <h3>{claim.texto}</h3>
          <p className="verdict" data-verdict={claim.classificacao}>{classifications[claim.classificacao]}</p>
          <p>{claim.justificativa}</p>
          {claim.fontes.length > 0 && <p>Fontes: {claim.fontes.map(number => (
            report.fontes[number - 1] && <a className="reference" key={number} href={`#source-${number}`} aria-label={`Fonte ${number}`}>{number}</a>
          ))}</p>}
        </article>
      ))}
      </div>
      <aside className="panel panel-body report-sources" aria-label="Fontes e sugestões">
      <h3>Fontes</h3>
      {report.fontes.length === 0 && <p className="guide">Nenhuma fonte disponível para este relatório.</p>}
      {report.fontes.length > 0 && (
          <ol className="sources">
            {report.fontes.map((source, index) => (
              <li id={`source-${index + 1}`} key={index} tabIndex={-1}>
                {/^https?:\/\//i.test(source.url)
                  ? <a href={source.url} target="_blank" rel="noreferrer">{source.titulo} <Icon name="arrow" /></a>
                  : source.titulo}
              </li>
            ))}
          </ol>
      )}
      </aside>
      <div className="panel panel-body ai-note">
        <h3>Indícios de conteúdo gerado por IA</h3>
        <p>{report.indicios_ia || "O relatório não apontou indícios."}</p>
        <p className="field-note">Indícios não confirmam autoria.</p>
      </div>
    </div>
  );
}
