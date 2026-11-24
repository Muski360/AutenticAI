# API do AutenticAI

A API recebe texto ou print, analisa o conteúdo com Gemini e guarda o relatório no histórico da conta que enviou a análise.

## Configuração

Execute os comandos abaixo em `system/backend/`.

1. Entre com `npx supabase login` e vincule o ambiente com `npx supabase link --project-ref REF_DO_PROJETO`. O projeto remoto AutenticAI já tem o esquema inicial. Para aplicar migrações pendentes ao projeto vinculado, rode `npx supabase db push --remote --dry-run` e depois `npx supabase db push --remote`. [Migração SQL](supabase/migrations/20261119000000_historico.sql)
2. Configure o provedor Google no Supabase Auth com o ID e o segredo de um cliente OAuth do Google. Cadastre no Google a URL de callback mostrada pelo Supabase e autorize no Supabase a URL de retorno do cliente. [Guia de login Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
3. Preencha `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `GEMINI_API_KEY` em `system/backend/.env`. Em outro checkout, copie `.env.example` primeiro. Ajuste `ALLOWED_ORIGINS` com as origens web e da extensão, separadas por vírgula.
4. Execute `npm ci` e `npm run dev`. A API local usa `http://localhost:8787`. Rode `npm test` para verificar o fluxo com respostas simuladas e `npm run check` para conferir o pacote do Worker.

Com o Worker local em execução, use `npm run smoke` em outro terminal. O comando verifica saúde, CORS, rejeição de sessão ausente ou inválida e conexão com o Supabase. Ele também informa se o login Google está habilitado. A verificação não cria análises nem chama o Gemini.

O identificador configurado é `gemini-3.5-flash`, que a Google redireciona para o Gemini 3.6 Flash. A pesquisa Google requer acesso para uso pago da API. [Notas da Gemini API](https://aistudio.google.com/docs/changelog#10-08-2026) · [Preços e acesso](https://aistudio.google.com/docs/pricing)

## Publicação no Cloudflare

O Worker `autenticai-api` está em [autenticai-api.muski.workers.dev](https://autenticai-api.muski.workers.dev/health). As origens autorizadas são `https://autenticai-web.muski.workers.dev` e `chrome-extension://cneblicgbokemnhohbkepapiahgfnmgh`.

Para publicar uma nova versão, execute `npm test`, `npm run check` e `npx wrangler deploy` em `system/backend/`. Ao configurar um novo Worker, passe um JSON temporário com `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `ALLOWED_ORIGINS` para `wrangler deploy --secrets-file`. Use a chave publicável do Supabase, que permite ao PostgreSQL aplicar o RLS com o token de cada usuário. [Configuração de segredos no Cloudflare](https://developers.cloudflare.com/workers/configuration/secrets/)

O histórico já está disponível para sessões Google. O Worker responde `503` a pedidos de análise até a configuração de `GEMINI_API_KEY`. Adicione essa chave como segredo do Worker na etapa final.

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

Em cada afirmação, `fontes` lista posições (a partir de 1) do array de fontes do relatório. Sem evidência associada, a classificação é inconclusiva. `sugestoes_google` no resultado imediato contém as sugestões retornadas pelo Google quando disponíveis. O cliente deve exibi-las seguindo as regras de apresentação do provedor. [Pesquisa Google no Gemini](https://ai.google.dev/gemini-api/docs/generate-content/google-search)
