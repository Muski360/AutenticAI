"use client";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Workspace } from "./workspace";
import { Brand, Icon, Investigation } from "./brand";

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
          <span className="eyebrow sidebar-caption">Seu espaço de investigação</span>
          <nav className="sidebar-nav" aria-label="Espaço de análise">
            <a href="#new-analysis"><Icon name="plus" /> Nova análise</a>
            <a href="#history"><Icon name="clock" /> Histórico</a>
          </nav>
          <div className="sidebar-note">
            <Icon name="lock" />
            <p>Seu histórico é privado. Você pode consultar e excluir suas análises.</p>
          </div>
        </aside>
        <div className="app-column">
          <header className="app-header">
            <a className="mobile-brand" href="#main-content"><Brand /></a>
            <span className="eyebrow breadcrumb">Plataforma <span>/</span> Investigação</span>
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
          <nav aria-label="Navegação principal"><a href="#metodo">O método</a></nav>
          <button className="button dark small" type="button" disabled={!ready || busy} onClick={authenticate}>Entrar <Icon name="arrow" /></button>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section className="hero frame" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <p className="eyebrow marker">Um novo olhar sobre a informação</p>
            <h1 id="hero-heading">Antes de<br />compartilhar,<br /><span>questione.</span></h1>
            <p className="hero-intro">Entre uma informação e a sua confiança, existe um caminho. Explore as evidências. Entenda o contexto. Forme sua opinião.</p>
            <div className="actions hero-actions">
              <button className="button dark" type="button" disabled={!ready || busy} onClick={authenticate}>Entrar com Google <Icon name="arrow" /></button>
              <a className="text-link" href="#metodo">Conheça a ideia <Icon name="right" /></a>
            </div>
            {error ? <p className="feedback error" role="alert">{error}</p> : !configured || !ready ? (
              <p className="hero-note" role="status">{configured ? "Verificando sua sessão…" : "O acesso ainda não está disponível neste ambiente."}</p>
            ) : <p className="hero-note"><Icon name="lock" /> Você revisa o conteúdo antes de enviar.</p>}
          </div>
          <Investigation />
        </section>
        <div className="frame hero-end"><span>Independência para pensar. Contexto para decidir.</span><a href="#metodo">Conheça o método <span aria-hidden="true">↓</span></a></div>
        <section className="method" id="metodo" aria-labelledby="method-title">
          <div className="frame">
            <p className="eyebrow marker">O método</p>
            <h2 id="method-title">Da dúvida<br />à <span>evidência.</span></h2>
            <ol>
              <li><span>01</span><h3>Escolha o conteúdo.</h3><p>Digite um texto ou selecione um print para investigar.</p><Icon name="file" /></li>
              <li><span>02</span><h3>Revise antes de enviar.</h3><p>Confira o que será enviado para análise e decida se quer continuar.</p><Icon name="shield" /></li>
              <li><span>03</span><h3>Explore as fontes.</h3><p>Leia as justificativas e consulte as fontes disponíveis antes de tirar conclusões.</p><Icon name="search" /></li>
            </ol>
          </div>
        </section>
      </main>
      <footer className="frame site-footer"><Brand /><span>Projeto acadêmico do SENAI</span></footer>
    </>
  );
}
