# Plano de ação do AutenticAI

Entregar o nível Light na web, na extensão Chrome e no Android. A demonstração deve incluir login Google, prévia e confirmação, análise com fontes quando disponíveis e histórico privado. Use os [requisitos](docs/PLANEJAMENTO_E_REQUISITOS.md), os [fluxos](docs/REQUISITOS_E_PROTOTIPAGEM.md) e a [arquitetura](docs/ARQUITETURA.md) como referência.

Ao terminar uma etapa, atualize seu estado, anote o que testou e indique a próxima ação. Quando uma credencial externa faltar, registre o bloqueio e avance nas tarefas que podem ser verificadas localmente.

## 1. Validar a base e preparar o ambiente

**Concluído em 24/11/2026.** O repositório já tem os três projetos base e o Supabase remoto com a migração inicial.

- [x] Rodar `npm test` e `npm run check` em `system/backend/`. Os três testes com serviços simulados e o empacotamento do Worker passaram.
- [x] Criar e executar `npm run smoke` com o Worker local. O teste verifica saúde, CORS, rejeição de sessão ausente ou inválida e acesso às configurações do Supabase.
- [x] Registrar as dependências do teste real. O Supabase respondeu com HTTP 200 e indicou que o provedor Google está desativado. Uma chamada de teste ao Gemini retornou HTTP 429 `RESOURCE_EXHAUSTED`.

## 2. Entregar o fluxo web

**Fluxo web validado localmente.** O login Google, o envio para análise com Groq e Tavily e a consulta do relatório salvo no Supabase passaram. [Relatório de testes](docs/relatorios_testes/groq_tavily.md)

1. Implementar login Google pelo Supabase Auth, retorno OAuth, recuperação de sessão e logout. Configurar o cliente OAuth e as URLs de retorno de desenvolvimento. Conferir a [configuração oficial do Google no Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).
2. Criar a entrada por texto ou print, com prévia, aviso de envio ao serviço de IA, confirmação e cancelamento. Enviar o token de acesso ao Worker. Respeitar os limites de 20.000 caracteres e 5 MiB e os formatos PNG, JPEG e WebP.
3. Mostrar afirmações, classificação, justificativas e fontes. Exibir os indícios de geração por IA em seção própria, sem porcentagem ou certeza de autoria. Tratar processamento, falta de evidência, sessão expirada e falhas dos provedores.
4. Implementar lista, detalhe e exclusão do histórico usando a API. Testar texto e print com respostas simuladas. Conferir o fluxo com teclado e em tela estreita e verificar o isolamento entre contas no Supabase.

**Pronto para avançar quando** o login e o acesso ao histórico funcionam com uma conta real, e texto e print passam nos testes simulados da interface.

**Verificação local.** O teste no Chrome com serviços simulados cobriu retorno OAuth com PKCE, sessão após recarregar, prévia e cancelamento, texto e print, erro de cota com nova tentativa, fontes, histórico e logout. Foi executado em uma janela de 320 px.

**Verificação dos serviços reais.** O Supabase confirmou que o provedor Google está habilitado. A abertura do login redirecionou ao Google com o callback do Supabase. O retorno local pela porta 3001 também está autorizado, pois outro projeto usa a 3000.

**Validação do usuário.** O login web e a abertura do histórico funcionaram com o Supabase real.

## 3. Entregar o fluxo na extensão Chrome

**Implementação disponível.** Compile e carregue a extensão descompactada seguindo o [guia da extensão](system/extension/README.md). O retorno OAuth e a origem da extensão foram autorizados para o ambiente de teste.

1. Implementar o login Google pelo Supabase Auth com o fluxo de identidade do Chrome. Autorizar o retorno OAuth e a origem da extensão de teste.
2. Solicitar acesso à aba ativa quando a pessoa iniciar a ação. Ler seu texto, mostrar a prévia e enviar apenas após confirmação. Explicar quando a página for protegida, estiver sem texto ou exceder o limite.
3. Mostrar o resultado e o histórico da conta. Carregar a extensão descompactada e testar login, página comum, página restrita, cancelamento, análise e exclusão.

**Pronto para avançar quando** o login Google e o histórico abrirem na extensão carregada. A análise pode ser simulada nesta etapa.

**Verificação local.** O build carregou no Chrome. Os testes no Chromium cobriram PKCE e recuperação da sessão com retorno simulado, bloqueio de aba, prévia, cancelamento, erro de cota, fontes, histórico e logout. O Supabase real iniciou o fluxo OAuth, e o Worker aceitou a origem local da extensão.

**Validação do usuário.** A extensão carregada funcionou no perfil de teste.

## 4. Entregar o fluxo Android

**Implementação disponível.** O app aceita texto, print escolhido e captura pelo botão flutuante. As três entradas passam por prévia e confirmação. O retorno do Android está autorizado no Supabase.

1. Conectar o login Google pelo Supabase Auth com retorno ao app. Aceitar texto digitado e print escolhido, com a mesma prévia, resultado e histórico usados na análise de uma captura.
2. Implementar o botão flutuante e pedir a autorização de sobreposição nas configurações do Android. Quando a pessoa tocar no botão, pedir consentimento para uma sessão de `MediaProjection` e iniciar o serviço em primeiro plano exigido pelo Android.
3. Capturar uma imagem, encerrar a sessão e abrir a prévia para confirmação ou cancelamento. Limpar a imagem temporária ao encerrar o fluxo. Tratar permissões negadas, tela protegida e interrupção da captura.
4. Executar `flutter analyze`, `flutter test` e validar em Android. Conferir a captura, o envio confirmado, o histórico e os casos em que a captura precisa ser recusada.

**Verificação local.** A análise estática e os quatro testes Flutter passaram. No emulador Android 14, conferi o retorno PKCE com autenticação simulada, a recusa do consentimento, a captura pelo botão flutuante, a prévia, o encerramento da sessão de captura e a abertura do histórico. O Supabase real iniciou o redirecionamento do Android ao Google.

**Validação do usuário.** O login Google e a abertura do histórico funcionaram no Android.

## 5. Preparar e verificar a entrega

**Identidade visual aplicada.** A [web](https://autenticai-web.muski.workers.dev/) e a [API](https://autenticai-api.muski.workers.dev/health) estão publicadas no Cloudflare.

1. Aplicar a [identidade visual](docs/IDENTIDADE_VISUAL.md) à web, à extensão e ao Android após fechar os fluxos funcionais. Conferir contraste, teclado, toque e telas estreitas.
2. Publicar a web e o Worker no Cloudflare. Configurar segredos no Worker, HTTPS, origens permitidas e URLs de retorno nos provedores. Gerar o APK de demonstração e preparar a pasta da extensão para carregamento descompactado.
3. Testar login e histórico com duas contas e verificar os fluxos das três plataformas. Conferir falhas de rede, permissões Android e ausência de armazenamento permanente de prints. Após publicar a integração, usar uma frase curta para validar análise, consulta e exclusão do registro com as cotas gratuitas.
4. Atualizar os guias com as instruções de instalação e execução, as limitações conhecidas e um roteiro de demonstração. Registrar os resultados dos testes e as versões entregues.

**Verificação visual local.** A web passou no lint, no build e nos testes de navegador entre 320 e 1440 px, com teclado e movimento reduzido. A extensão Manifest V3 passou no build e no teste do painel em 320 e 360 px. O Android passou na análise estática e nos quatro testes Flutter. No emulador Android 16, validei por toque o editor, a prévia, o cancelamento, o resultado com fontes e o histórico. Os fluxos usaram dados simulados.

**Verificação publicada.** A abertura, os recursos estáticos e a página 404 passaram no navegador. A API respondeu `200` em `/health`, `204` no preflight da web e da extensão, `403` para origem externa, `401` para sessão ausente ou inválida e `503` no teste de análise com corpo vazio. No Supabase, confirmei a migração, o RLS do histórico e a URL de retorno. O redirecionamento para o Google foi real. O retorno OAuth, a sessão após recarga, o histórico e a saída passaram no build publicado com respostas simuladas.

**Próxima ação.** Publicar a integração Groq e Tavily no Cloudflare e repetir a análise de uma frase curta na web publicada.

**Pronto quando** outra pessoa consegue instalar ou abrir as três interfaces e executar a demonstração seguindo o README.
