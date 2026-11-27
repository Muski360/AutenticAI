"use client";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AccessForm } from "./components/access-form";
import { Brand, Icon } from "./components/brand";
import { ReportBody, Verdict, type ReportData } from "./components/report";
import { Workspace } from "./components/workspace";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const api = process.env.NEXT_PUBLIC_API_URL;
let client: SupabaseClient | undefined;

const votingExample = {
  afirmacoes: [
    {
      texto: "No Brasil, é obrigatório votar aos 16 anos.",
      classificacao: "contradita",
      justificativa: "O TSE informa que o voto é facultativo para jovens de 16 e 17 anos.",
      fontes: [1],
    },
    {
      texto: "O voto é facultativo para quem tem mais de 70 anos.",
      classificacao: "sustentada",
      justificativa: "O TSE inclui pessoas com mais de 70 anos entre os grupos para os quais o voto é facultativo.",
      fontes: [1],
    },
  ],
  fontes: [{
    titulo: "Tribunal Superior Eleitoral · Quem pode votar",
    url: "https://www.tse.jus.br/comunicacao/noticias/2026/Setembro/faltam-18-dias-quem-vota-quem-pode-votar-e-o-que-muda-aos-18-anos",
  }],
} satisfies ReportData;

export default function Home() {
  const [session, setSession] = useState<Session | null>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!url || !key || !api) return;
    client ??= createClient(url, key, { auth: { flowType: "pkce" } });
    const callback = new URL(window.location.href);
    const fragment = new URLSearchParams(callback.hash.slice(1));
    const returned = callback.searchParams.has("code");
    const failed = callback.searchParams.has("error") || fragment.has("error");
    const { data: { subscription } } = client.auth.onAuthStateChange((event, current) => {
      setSession(current);
      if (event === "INITIAL_SESSION" && (failed || (returned && !current))) {
        setError("Não foi possível concluir o acesso. Tente entrar novamente.");
        window.history.replaceState(null, "", window.location.pathname);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!client) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
    } catch {
      setError("Não foi possível sair. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (session && api) {
    return (
      <div className="app-shell">
        <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
        <aside className="app-sidebar">
          <a className="sidebar-brand" href="#main-content"><Brand /></a>
          <nav className="sidebar-nav" aria-label="Espaço de análise">
            <a href="#new-analysis"><Icon name="plus" /> Nova análise</a>
            <a href="#history"><Icon name="clock" /> Histórico</a>
          </nav>
        </aside>
        <div className="app-column">
          <header className="app-header">
            <a className="mobile-brand" href="#main-content"><Brand /></a>
            <button type="button" className="button small" disabled={busy} onClick={signOut}>Sair</button>
          </header>
          <main id="main-content" className="app-main" tabIndex={-1}>
            {error && <p className="feedback error" role="alert">{error}</p>}
            <Workspace key={session.user.id} api={api} token={session.access_token} />
          </main>
        </div>
      </div>
    );
  }

  const configured = Boolean(url && key && api);
  const ready = configured && session !== undefined;
  return (
    <>
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <header className="site-header">
        <div className="frame header-inner">
          <a href="#main-content"><Brand /></a>
          <nav aria-label="Navegação principal">
            <a href="#metodo">O método</a>
            <a href="#plataformas">Onde usar</a>
            <a href="#compromisso">Privacidade</a>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-grid">
            <div className="hero-intro">
              <h1 id="hero-heading">Análise de<br /><span>informações</span></h1>
              <p>Envie um texto ou print e confira as fontes de cada afirmação.</p>
            </div>
            <figure className="debate-hero">
              <Image src="/brand/debate-stage.webp" alt="" fill preload unoptimized className="debate-image" />
              <figcaption className="debate-caption">
                <p>Exemplo de checagem</p>
                <blockquote>“{votingExample.afirmacoes[0].texto}”</blockquote>
                <div className="debate-caption-actions">
                  <Verdict classification={votingExample.afirmacoes[0].classificacao} />
                  <a className="debate-link" href="#exemplo">Ver exemplo <Icon name="right" /></a>
                </div>
              </figcaption>
            </figure>
            <div className="hero-access">
              {ready && client ? (
                <AccessForm auth={client.auth} callbackError={error} clearCallbackError={() => setError("")} />
              ) : (
                <p className="hero-note" role="status">{configured ? "Verificando sua sessão…" : "O acesso ainda não está disponível neste ambiente."}</p>
              )}
            </div>
          </div>
        </section>
        <section className="frame landing-section" id="exemplo" tabIndex={-1} aria-labelledby="example-title">
          <h2 id="example-title">Relatório de exemplo</h2>
          <ReportBody report={votingExample} />
        </section>
        <section className="method" id="metodo" aria-labelledby="method-title">
          <div className="frame">
            <div className="method-head">
              <h2 id="method-title">O método</h2>
              <div className="method-dial" aria-hidden="true"><Image src="/brand/symbol.webp" width={320} height={320} alt="" unoptimized /></div>
            </div>
            <ol>
              <li><span aria-hidden="true">01</span><p>Escolha um texto ou print.</p><Icon name="file" /></li>
              <li><span aria-hidden="true">02</span><p>Revise o conteúdo antes de enviar.</p><Icon name="shield" /></li>
              <li><span aria-hidden="true">03</span><p>Consulte as justificativas e fontes.</p><Icon name="search" /></li>
            </ol>
          </div>
        </section>
        <section className="platforms" id="plataformas" aria-labelledby="platforms-title">
          <div className="frame landing-section">
            <h2 id="platforms-title">Onde usar</h2>
            <dl className="platform-list">
              <div><dt><Icon name="browser" /> Web</dt><dd>Texto ou print.</dd></div>
              <div><dt><Icon name="scan" /> Extensão Chrome</dt><dd>Texto da aba ativa.</dd></div>
              <div><dt><Icon name="phone" /> Android</dt><dd>Texto, print ou captura de tela com autorização.</dd></div>
            </dl>
          </div>
        </section>
        <section className="frame landing-section commitment" id="compromisso" aria-labelledby="commitment-title">
          <h2 id="commitment-title">Privacidade <span>e limites</span></h2>
          <dl>
            <div><dt>O histórico é privado</dt><dd>Você pode consultar e excluir suas análises.</dd></div>
            <div><dt>Limites da análise</dt><dd>O resultado pode conter erros ou ser inconclusivo.</dd></div>
          </dl>
        </section>
      </main>
      <footer className="frame site-footer"><Brand /><span>Projeto acadêmico do SENAI</span></footer>
    </>
  );
}
