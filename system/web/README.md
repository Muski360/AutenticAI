# AutenticAI na web

Cliente em Next.js para login Google, análise de texto ou print e histórico.

Em `system/web/`, execute:

```sh
npm ci
npm run dev
```

Copie `.env.example` para `.env.local` e preencha a URL e a chave publicável do projeto Supabase. `NEXT_PUBLIC_API_URL` deve apontar para o Worker. Use a mesma origem da web em `ALLOWED_ORIGINS` no backend. Reinicie o Next.js após alterar as variáveis.

No Supabase Auth, habilite o provedor Google e autorize `http://localhost:3000/` como URL de retorno para o ambiente local. Configure o callback do Supabase no cliente OAuth do Google. A aplicação usa a página inicial para concluir o login no mesmo navegador. [Guia do Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)

Inicie a [API local](../backend/README.md) e abra [localhost:3000](http://localhost:3000). Use `npm run lint` e `npm run build` para validar o projeto. O teste com análise real precisa de acesso ao Gemini com pesquisa.
