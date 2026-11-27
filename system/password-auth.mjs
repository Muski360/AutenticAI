/** @typedef {"login" | "signup" | "confirm"} PasswordMode */
/** @typedef {{ code?: string, status?: number }} AuthError */
/** @template T @typedef {{ data: { session: T | null }, error: AuthError | null }} AuthResult */
/** @typedef {{ email: string, password: string }} Credentials */

/**
 * @template T
 * @param {{
 *   signInWithPassword: (credentials: Credentials) => Promise<AuthResult<T>>,
 *   signUp: (credentials: Credentials) => Promise<AuthResult<T>>,
 *   verifyOtp: (verification: { email: string, token: string, type: "email" }) => Promise<AuthResult<T>>
 * }} auth
 * @param {PasswordMode} mode
 * @param {string} address
 * @param {string} secret
 */
export async function passwordAuth(auth, mode, address, secret) {
  const email = address.trim();
  const result = mode === "login"
    ? await auth.signInWithPassword({ email, password: secret })
    : mode === "signup"
      ? await auth.signUp({ email, password: secret })
      : await auth.verifyOtp({ email, token: secret.trim(), type: "email" });

  if (result.error || (!result.data.session && mode !== "signup")) {
    throw new Error(authMessage(mode, result.error));
  }
  return result.data.session;
}

/** @param {PasswordMode} mode @param {AuthError | null} error */
function authMessage(mode, error) {
  if (error?.status === 429) return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  switch (error?.code) {
    case "invalid_credentials": return "E-mail ou senha incorretos.";
    case "email_not_confirmed": return "Confirme seu e-mail antes de entrar.";
    case "weak_password": return "Escolha uma senha mais forte e tente novamente.";
    case "otp_expired": return "Código inválido ou expirado. Confira o código ou refaça o cadastro.";
  }
  if (mode === "signup") return "Não foi possível criar a conta. Confira os dados ou tente entrar.";
  if (mode === "confirm") return "Não foi possível confirmar o e-mail. Confira o código e tente novamente.";
  return "Não foi possível entrar. Tente novamente.";
}
