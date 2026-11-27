import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { passwordAuth, type PasswordMode } from "../../../password-auth.mjs";
import { Icon } from "./brand";

export function AccessForm({ auth, callbackError, clearCallbackError }: {
  auth: SupabaseClient["auth"];
  callbackError: string;
  clearCallbackError: () => void;
}) {
  const [mode, setMode] = useState<PasswordMode>("login");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const codeField = useRef<HTMLInputElement>(null);
  const confirming = mode === "confirm";
  const action = mode === "signup" ? "Criar conta" : confirming ? "Confirmar e-mail" : "Entrar com e-mail";

  useEffect(() => {
    if (confirming) codeField.current?.focus();
  }, [confirming]);

  function clearError() {
    setError("");
    clearCallbackError();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const secret = String(new FormData(event.currentTarget).get("secret") ?? "");
    clearError();
    setBusy(mode === "signup" ? "Criando conta…" : confirming ? "Confirmando e-mail…" : "Entrando…");
    try {
      const session = await passwordAuth(auth, mode, email, secret);
      if (mode === "signup" && !session) setMode("confirm");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível concluir. Tente novamente.");
    } finally {
      setBusy("");
    }
  }

  async function openGoogle() {
    if (busy) return;
    clearError();
    setBusy("Abrindo login Google…");
    try {
      const { data, error } = await auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: new URL("/", window.location.origin).href, skipBrowserRedirect: true },
      });
      if (error || !data.url) throw error ?? new Error();
      window.location.assign(data.url);
    } catch {
      setError("Não foi possível abrir o login Google. Tente novamente.");
      setBusy("");
    }
  }

  return (
    <div className="access-form">
      <form method="post" onSubmit={submit}>
        <fieldset disabled={!!busy}>
          <legend className="sr-only">{action}</legend>
          <label className="field">E-mail
            <input name="email" type="email" autoComplete="username" required readOnly={confirming}
              value={email} onChange={event => setEmail(event.target.value)} />
          </label>
          {confirming ? (
            <div key="code">
              <label className="field">Código de confirmação
                <input ref={codeField} name="secret" inputMode="numeric" pattern="[0-9]+"
                  autoComplete="one-time-code" required aria-describedby="access-code-note" />
              </label>
              <p className="guide" id="access-code-note">Use o código do e-mail ou confirme pelo link e volte para entrar.</p>
            </div>
          ) : (
            <label className="field">Senha
              <input key={mode} name="secret" type="password" required
                autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            </label>
          )}
          <div className="actions access-actions">
            <button className="button dark" type="submit">{action} <Icon name="arrow" /></button>
            <button className="access-switch" type="button" onClick={() => {
              clearError();
              setMode(mode === "login" ? "signup" : "login");
            }}>{mode === "login" ? "Criar conta" : "Voltar para entrar"}</button>
          </div>
        </fieldset>
      </form>
      {!confirming && (
        <div className="access-google">
          <button type="button" disabled={!!busy} onClick={openGoogle}>Entrar com Google <Icon name="arrow" /></button>
        </div>
      )}
      {busy && <p className="hero-note" role="status">{busy}</p>}
      {(error || callbackError) && <p className="feedback error" role="alert">{error || callbackError}</p>}
    </div>
  );
}
