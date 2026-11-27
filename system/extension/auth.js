import { createClient } from "@supabase/supabase-js";
import { passwordAuth } from "../password-auth.mjs";

const storage = chrome.storage.local;
const trustedStorage = storage.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: false,
    autoRefreshToken: false,
    storage: {
      getItem: async key => { await trustedStorage; return (await storage.get(key))[key] ?? null; },
      setItem: async (key, value) => { await trustedStorage; await storage.set({ [key]: value }); },
      removeItem: async key => { await trustedStorage; await storage.remove(key); },
    },
  },
});
let signingIn;

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.url !== chrome.runtime.getURL("popup.html")) return;
  handleAuth(message).then(data => respond({ data }), error => {
    respond({ error: error.message || "Não foi possível confirmar a sessão." });
  });
  return true;
});

async function handleAuth(message) {
  const { type, mode, email, secret } = message ?? {};
  if (type === "login" || type === "password") {
    if (signingIn) throw new Error("Aguarde o acesso em andamento e tente novamente.");
    if (type === "password") {
      if (!["login", "signup", "confirm"].includes(mode) || typeof email !== "string" || typeof secret !== "string") {
        throw new Error("Confira os dados e tente novamente.");
      }
      signingIn = passwordAuth(supabase.auth, mode, email, secret);
    } else {
      signingIn = login();
    }
    try {
      const session = await signingIn;
      if (type === "password" && mode === "signup" && !session) {
        await chrome.storage.session.set({ pendingSignupEmail: email.trim() });
      } else {
        await chrome.storage.session.remove("pendingSignupEmail");
      }
      if (type === "password") return session?.access_token ?? null;
    } finally {
      signingIn = undefined;
    }
  } else if (type === "logout") {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw new Error("Não foi possível sair. Tente novamente.");
    return null;
  } else if (type !== "session") {
    throw new Error("Ação inválida.");
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error("Não foi possível recuperar a sessão. Entre novamente.");
  return data.session?.access_token ?? null;
}

async function login() {
  try {
    const redirectTo = chrome.identity.getRedirectURL("google");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google", options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) throw error ?? new Error();
    const callback = new URL(await chrome.identity.launchWebAuthFlow({ url: data.url, interactive: true }));
    const expected = new URL(redirectTo);
    const code = callback.searchParams.get("code");
    if (callback.origin !== expected.origin || callback.pathname !== expected.pathname || !code) throw new Error();
    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    if (exchanged.error || !exchanged.data.session) throw new Error();
  } catch {
    throw new Error("Não foi possível entrar com Google. Tente novamente.");
  }
}
