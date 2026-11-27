import { sourceUrl } from "../../../analysis-client.mjs";
import { Icon } from "./brand";

const classifications = {
  sustentada: { label: "Sustentada", total: "Sustentadas", icon: "check" },
  contradita: { label: "Contradita", total: "Contraditas", icon: "cross" },
  mista: { label: "Evidências mistas", total: "Mistas", icon: "mixed" },
  inconclusiva: { label: "Inconclusiva", total: "Inconclusivas", icon: "question" },
} as const;

type Classification = keyof typeof classifications;
const verdictOrder = Object.keys(classifications) as Classification[];

export type ReportData = {
  texto_analisado?: string;
  afirmacoes: { texto: string; classificacao: Classification; justificativa: string; fontes: number[] }[];
  fontes: { titulo: string; url: string }[];
  indicios_ia?: string | null;
  limitacao?: string | null;
};

export function Verdict({ classification }: { classification: Classification }) {
  const { label, icon } = classifications[classification];
  return <span className="verdict" data-verdict={classification}><Icon name={icon} /> {label}</span>;
}

export function ReportBody({ report }: { report: ReportData }) {
  return (
    <div className="report">
      {report.afirmacoes.length > 0 && (
        <ul className="report-totals" aria-label="Resumo das classificações" role="list">
          {verdictOrder.map(classification => (
            <li key={classification} data-verdict={classification}>
              <Icon name={classifications[classification].icon} />
              <strong>{report.afirmacoes.filter(claim => claim.classificacao === classification).length}</strong>
              <span>{classifications[classification].total}</span>
            </li>
          ))}
        </ul>
      )}
      {report.texto_analisado && (
        <details className="report-transcript">
          <summary>Texto analisado</summary>
          <p className="content">{report.texto_analisado}</p>
        </details>
      )}
      {report.limitacao && <p className="report-limit"><strong>Limites da análise</strong>{report.limitacao}</p>}
      <div className="report-layout">
        <section aria-labelledby="report-claims-heading">
          <h3 className="report-heading" id="report-claims-heading">Afirmações verificadas</h3>
          {report.afirmacoes.length === 0 ? (
            <p className="report-empty">Nenhuma afirmação verificável foi identificada.</p>
          ) : (
            <div className="report-claims">
              {report.afirmacoes.map((claim, index) => {
                const references = claim.fontes.filter(number => report.fontes[number - 1]);
                return (
                  <article className="claim" key={index} data-verdict={claim.classificacao}>
                    <header className="claim-header">
                      <h4>{claim.texto}</h4>
                      <Verdict classification={claim.classificacao} />
                    </header>
                    <div className="claim-body">
                      <div className="claim-reason">
                        <strong>Justificativa</strong>
                        <p>{claim.justificativa}</p>
                      </div>
                      {references.length > 0 && (
                        <div className="claim-references">
                          <span>Fontes desta afirmação</span>
                          {references.map(number => (
                            <a className="reference" key={number} href={`#source-${number}`} aria-label={`Fonte ${number}`}>{number}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <aside className="report-sources" aria-labelledby="report-sources-heading">
          <h3 className="report-heading" id="report-sources-heading">Fontes</h3>
          {report.fontes.length > 0 ? (
            <ol className="sources" role="list">
              {report.fontes.map((source, index) => {
                const url = sourceUrl(source.url);
                return (
                  <li id={`source-${index + 1}`} key={index} tabIndex={-1}>
                    <span className="source-number"><span className="sr-only">Fonte </span>{index + 1}</span>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer">
                        <span>{source.titulo}<small>{new URL(url).hostname}</small></span>
                        <Icon name="arrow" />
                        <span className="sr-only"> (abre em nova aba)</span>
                      </a>
                    ) : <span>{source.titulo}</span>}
                  </li>
                );
              })}
            </ol>
          ) : <p className="report-empty">Nenhuma fonte disponível para este relatório.</p>}
        </aside>
      </div>
      {report.indicios_ia !== undefined && (
        <section className="ai-note" aria-labelledby="report-ai-heading">
          <h3 className="report-heading" id="report-ai-heading">Indícios de conteúdo gerado por IA</h3>
          <p>{report.indicios_ia || "O relatório não apontou indícios."}</p>
          <p className="field-note">Indícios não confirmam autoria.</p>
        </section>
      )}
    </div>
  );
}
