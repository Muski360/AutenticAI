import { createClient } from "@supabase/supabase-js";

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
  handleAuth(message?.type).then(data => respond({ data }), error => {
    respond({ error: error.message || "Não foi possível confirmar a sessão." });
  });
  return true;
});

async function handleAuth(type) {
  if (type === "login") {
    signingIn ??= login().finally(() => { signingIn = undefined; });
    await signingIn;
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
