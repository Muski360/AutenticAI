import { build } from "esbuild";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { clientConfig } from "../client-config.mjs";

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, API_URL } = clientConfig();
if (!URL.canParse(SUPABASE_URL) || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Configure a URL HTTPS e a chave publicável do Supabase.");
}
const supabase = new URL(SUPABASE_URL);
if (supabase.protocol !== "https:") throw new Error("Use HTTPS no endereço do Supabase.");
if (!URL.canParse(API_URL)) throw new Error("Configure um endereço válido para a API.");
const api = new URL(API_URL);
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
  minify: true,
  outdir: "dist",
  target: "chrome120",
  define: Object.fromEntries(Object.entries({
    SUPABASE_URL: supabase.origin,
    SUPABASE_PUBLISHABLE_KEY,
    API_URL: api.origin,
  }).map(([name, value]) => [name, JSON.stringify(value)])),
});
const staticFiles = {
  "popup.html": "popup.html",
  "popup.css": "popup.css",
  "brand.png": "../../assets/autenticai-lockup-horizontal-black.png",
  "symbol.png": "../../assets/autenticai-symbol-white-cyan.png",
  "Inter.woff2": "assets/Inter-Latin.woff2",
  "icon-128.png": "assets/icon-128.png",
  "OFL-Inter.txt": "assets/OFL-Inter.txt",
};
await Promise.all(Object.entries(staticFiles).map(([name, source]) => copyFile(source, `dist/${name}`)));
await writeFile("dist/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
