# AutenticAI na web

Cliente em Next.js para login Google, análise de texto ou print e histórico.

Em `system/web/`, execute:

```sh
npm ci
npm run dev
```

Copie `.env.example` para `.env.local` e preencha a URL e a chave publicável do projeto Supabase. `NEXT_PUBLIC_API_URL` deve apontar para o Worker. Use a mesma origem da web em `ALLOWED_ORIGINS` no backend. Reinicie o Next.js após alterar as variáveis.

No Supabase Auth, habilite o provedor Google e autorize `http://localhost:3000/` como URL de retorno para o ambiente local. Configure o callback do Supabase no cliente OAuth do Google. A aplicação usa a página inicial para concluir o login no mesmo navegador. [Guia do Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)

Inicie a [API local](../backend/README.md) e abra [localhost:3000](http://localhost:3000). Entre com Google, envie um texto curto e abra o relatório pelo histórico para testar Groq, Tavily e Supabase. Use `npm run lint` e `npm run build` para validar o projeto.

## Publicação no Cloudflare

A [web publicada](https://autenticai-web.muski.workers.dev/) é servida por Workers Static Assets. A `Site URL` do Supabase aponta para essa origem, e a lista de redirecionamentos inclui `https://autenticai-web.muski.workers.dev/`.

Para republicar, instale as dependências em `system/backend/` e `system/web/`. Em `system/web/`, configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com os valores do projeto e `NEXT_PUBLIC_API_URL` com `https://autenticai-api.muski.workers.dev`. Essas variáveis entram no build. Em PowerShell, execute:

```powershell
$env:CLOUDFLARE_STATIC_EXPORT = '1'
npm run build
if ($LASTEXITCODE -eq 0) {
  & ../backend/node_modules/.bin/wrangler.cmd deploy --config wrangler.jsonc
}
Remove-Item Env:CLOUDFLARE_STATIC_EXPORT
```
