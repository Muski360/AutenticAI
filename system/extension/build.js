import { build } from "esbuild";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { clientConfig } from "../client-config.mjs";

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, API_URL } = clientConfig();
const supabase = new URL(SUPABASE_URL || "");
const api = new URL(API_URL || "");
if (supabase.protocol !== "https:" || !SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_")) {
  throw new Error("Configure a URL HTTPS e a chave publicável do Supabase.");
}
if (api.protocol !== "https:" && !(api.protocol === "http:" && ["localhost", "127.0.0.1"].includes(api.hostname))) {
  throw new Error("Use HTTPS no endereço da API, exceto no ambiente local.");
}

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
// Chrome match patterns scope permissions to the host, without a port.
manifest.host_permissions = [...new Set([api, supabase].map(url => `${url.protocol}//${url.hostname}/*`))];
await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["auth.js", "popup.js"],
  bundle: true,
  outdir: "dist",
  target: "chrome120",
  define: Object.fromEntries(Object.entries({
    SUPABASE_URL: supabase.origin,
    SUPABASE_PUBLISHABLE_KEY,
    API_URL: api.origin,
  }).map(([name, value]) => [name, JSON.stringify(value)])),
});
await Promise.all([
  copyFile("popup.html", "dist/popup.html"),
  copyFile("popup.css", "dist/popup.css"),
  copyFile("../../assets/autenticai-lockup-horizontal-black.png", "dist/brand.png"),
  copyFile("../../assets/autenticai-symbol-white-cyan.png", "dist/symbol.png"),
  copyFile("../../assets/design/Inter-Latin.woff2", "dist/Inter.woff2"),
  copyFile("../../assets/design/icon-128.png", "dist/icon-128.png"),
  copyFile("../../assets/design/OFL-Inter.txt", "dist/OFL-Inter.txt"),
]);
await writeFile("dist/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
