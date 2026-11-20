# API do AutenticAI

A API recebe texto ou print, analisa o conteúdo com Gemini e guarda o relatório no histórico da conta que enviou a análise.

## Configuração

Execute os comandos abaixo em `system/backend/`.

1. Crie ou selecione o projeto AutenticAI no Supabase. Rode `npx supabase login` e `npx supabase db push --remote=REF_DO_PROJETO` para aplicar o esquema. [Migração SQL](supabase/migrations/20261119000000_historico.sql)
2. Configure o provedor Google no Supabase Auth e cadastre a URL de retorno do cliente. [Guia de login Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
3. Preencha `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `GEMINI_API_KEY` em `system/backend/.env`. Em outro checkout, copie `.env.example` primeiro. Ajuste `ALLOWED_ORIGINS` com as origens web e da extensão, separadas por vírgula.
4. Execute `npm ci` e `npm run dev`. A API local usa `http://localhost:8787`. Rode `npm test` para verificar o fluxo com respostas simuladas e `npm run check` para conferir o pacote do Worker.

O identificador configurado é `gemini-3.5-flash`, que a Google redireciona para o Gemini 3.6 Flash. A pesquisa Google requer acesso para uso pago da API. [Notas da Gemini API](https://aistudio.google.com/docs/changelog#10-08-2026) · [Preços e acesso](https://aistudio.google.com/docs/pricing)

Para publicar no Cloudflare, configure as variáveis da API na conta do Worker ou use `npx wrangler deploy --secrets-file .env` com o arquivo local preenchido. [Configuração de segredos no Cloudflare](https://developers.cloudflare.com/workers/configuration/secrets/)

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
