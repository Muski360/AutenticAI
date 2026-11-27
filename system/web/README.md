# AutenticAI na web

Cliente em Next.js para login com Google ou e-mail e senha, análise de texto ou print e histórico.

Em `system/web/`, execute:

```sh
npm ci
npm run dev
```

O Next.js lê os valores públicos da configuração compartilhada em `system/backend/`. As variáveis `NEXT_PUBLIC_*` documentadas abaixo podem sobrescrever esses valores na web. Use a mesma origem da web em `ALLOWED_ORIGINS` no backend e reinicie o Next.js após alterar as variáveis. [Configuração compartilhada](../backend/README.md#configuração)

No Supabase Auth, habilite o provedor Google e autorize `http://localhost:3000/` como URL de retorno para o ambiente local. Configure o callback do Supabase no cliente OAuth do Google. A aplicação usa a página inicial para concluir o login no mesmo navegador. [Guia do Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)

Inicie a [API local](../backend/README.md) e abra [localhost:3000](http://localhost:3000). Entre com um dos métodos disponíveis. Para criar uma conta por e-mail, use **Criar conta** e digite o código recebido na própria página. [Configuração de e-mail](../backend/README.md#login-por-e-mail) · [Testes de login](../../docs/relatorios_testes/login.md)

Envie um texto curto e abra o relatório pelo histórico para testar Groq, Tavily e Supabase. Use `npm run lint` e `npm run build` para validar o projeto.

## Publicação no Cloudflare

A [web publicada](https://autenticai-web.muski.workers.dev/) é servida por Workers Static Assets. A `Site URL` do Supabase aponta para essa origem, e a lista de redirecionamentos inclui `https://autenticai-web.muski.workers.dev/`.

Para republicar, instale as dependências em `system/backend/` e `system/web/`. Use os valores públicos do Supabase no arquivo compartilhado ou configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no ambiente de build. Em PowerShell, execute em `system/web/`:

```powershell
$env:CLOUDFLARE_STATIC_EXPORT = '1'
$env:NEXT_PUBLIC_API_URL = 'https://autenticai-api.muski.workers.dev'
npm run build
if ($LASTEXITCODE -eq 0) {
  & ../backend/node_modules/.bin/wrangler.cmd deploy --config wrangler.jsonc
}
Remove-Item Env:CLOUDFLARE_STATIC_EXPORT
Remove-Item Env:NEXT_PUBLIC_API_URL
```
