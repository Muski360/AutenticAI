# API do AutenticAI

A API recebe texto ou print, pesquisa fontes com a Tavily e usa a Groq para analisar o conteúdo com as evidências encontradas. O Supabase guarda o relatório no histórico da conta.

## Configuração

Execute os comandos abaixo em `system/backend/`.

1. Entre com `npx supabase login` e vincule o ambiente com `npx supabase link --project-ref REF_DO_PROJETO`. O projeto remoto AutenticAI já tem o esquema inicial. Para aplicar migrações pendentes ao projeto vinculado, rode `npx supabase db push --remote --dry-run` e depois `npx supabase db push --remote`. [Migração SQL](supabase/migrations/20261119000000_historico.sql)
2. Configure o provedor Google no Supabase Auth com o ID e o segredo de um cliente OAuth do Google. Cadastre no Google a URL de callback mostrada pelo Supabase e autorize no Supabase a URL de retorno do cliente. [Guia de login Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
3. Copie `.env.example` para `.env` e preencha `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `GROQ_API_KEY` e `TAVILY_API_KEY`. Ajuste `ALLOWED_ORIGINS` com as origens web e da extensão, separadas por vírgula. Mantenha as chaves da Groq e da Tavily no backend.
4. Execute `npm ci` e `npm run dev -- --env-file .env`. A API local usa `http://localhost:8787`. Rode `npm test` para verificar o fluxo com respostas simuladas e `npm run check` para conferir o pacote do Worker.

Com o Worker local em execução, use `npm run smoke` em outro terminal. O comando verifica saúde, CORS, rejeição de sessão ausente ou inválida e conexão com o Supabase. Ele também informa se o login Google está habilitado. O envio real é testado pela interface web. [Relatório de testes](../../docs/relatorios_testes/groq_tavily.md)

A análise usa `openai/gpt-oss-120b` por padrão. Um print exige uma chamada de transcrição adicional à Groq. Cada pesquisa básica da Tavily consome um crédito. Use as cotas gratuitas das duas contas, com a cobrança por uso da Tavily desativada. [Limites da Groq](https://console.groq.com/docs/rate-limits) · [Créditos da Tavily](https://docs.tavily.com/documentation/api-credits)

## Publicação no Cloudflare

O Worker `autenticai-api` está em [autenticai-api.muski.workers.dev](https://autenticai-api.muski.workers.dev/health). As origens autorizadas são `https://autenticai-web.muski.workers.dev` e `chrome-extension://cneblicgbokemnhohbkepapiahgfnmgh`.

Para publicar uma nova versão, execute `npm test` e `npm run check` em `system/backend/`. Configure `GROQ_API_KEY` e `TAVILY_API_KEY` como segredos do Worker. Configure também `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `ALLOWED_ORIGINS`, com os valores de produção. Use a chave publicável do Supabase para que o PostgreSQL aplique o RLS com o token de cada usuário. Publique com `npx wrangler deploy`. [Configuração de segredos no Cloudflare](https://developers.cloudflare.com/workers/configuration/secrets/)

Se faltar uma chave de provedor, o pedido de análise retorna `503`.

## Rotas

As rotas de análise esperam o token de acesso do Supabase em `Authorization: Bearer <token>`. O usuário obtém esse token após entrar com Google.

| Método e rota | Comportamento |
|---|---|
| `GET /health` | Verifica se o Worker responde. |
| `POST /analises` | Recebe JSON com `texto` ou um formulário multipart com o arquivo `imagem`. Responde `201` com o ID e o relatório. |
| `GET /analises?offset=0` | Lista até 20 entradas do usuário, começando pela mais recente. |
| `GET /analises/:id` | Consulta o relatório com as afirmações e fontes. |
| `DELETE /analises/:id` | Exclui um relatório do próprio histórico e retorna `204`. |

O texto pode ter até 20.000 caracteres. A imagem deve ser PNG, JPEG ou WebP e ter até 5 MiB. O histórico guarda o texto analisado, as afirmações, os indícios de IA e as fontes. A imagem é processada durante a solicitação.

Em cada afirmação, `fontes` lista as posições, a partir de 1, das fontes retornadas pela Tavily. Uma afirmação sem fonte associada fica inconclusiva.
