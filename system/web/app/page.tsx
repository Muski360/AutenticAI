"use client";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Brand, Icon, Investigation } from "./brand";
import { Workspace } from "./workspace";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const api = process.env.NEXT_PUBLIC_API_URL;
let client: SupabaseClient | undefined;

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
        setError("Não foi possível entrar com Google. Tente novamente.");
        window.history.replaceState(null, "", window.location.pathname);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function authenticate() {
    if (!client) return;
    setBusy(true);
    setError("");
    try {
      if (session) {
        const { error } = await client.auth.signOut({ scope: "local" });
        if (error) throw error;
      } else {
        const { data, error } = await client.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: new URL("/", window.location.origin).href, skipBrowserRedirect: true },
          });
        if (error || !data.url) throw error ?? new Error();
        window.location.assign(data.url);
        return;
      }
    } catch {
      setError(session ? "Não foi possível sair. Tente novamente." : "Não foi possível abrir o login Google. Tente novamente.");
    }
    setBusy(false);
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
            <button type="button" className="button small" disabled={busy} onClick={authenticate}>Sair</button>
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
          <div className="frame hero-grid">
            <div className="hero-copy">
              <h1 id="hero-heading">Análise de<br /><span>informações</span></h1>
              <div className="actions hero-actions">
                <button className="button dark" type="button" disabled={!ready || busy} onClick={authenticate}>Entrar com Google <Icon name="arrow" /></button>
              </div>
              {error ? <p className="feedback error" role="alert">{error}</p> : !configured || !ready ? (
                <p className="hero-note" role="status">{configured ? "Verificando sua sessão…" : "O acesso ainda não está disponível neste ambiente."}</p>
              ) : null}
            </div>
            <Investigation />
          </div>
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
        <section className="frame landing-section" id="exemplo" tabIndex={-1} aria-labelledby="example-title">
          <h2 id="example-title">Relatório de exemplo</h2>
          <div className="example-report">
            <blockquote>“A Lua emite luz própria.”</blockquote>
            <p className="verdict" data-verdict="contradita">Contradita</p>
            <p className="example-explanation">A superfície da Lua reflete a luz do Sol.</p>
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
