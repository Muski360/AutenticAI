# AutenticAI no Chrome

Extensão em Manifest V3 para entrar com Google ou e-mail e senha, analisar o texto da aba ativa e consultar o histórico.

1. Prepare a [configuração compartilhada](../backend/README.md#configuração). Em `system/extension/`, execute `npm ci` e `npm run build`. Repita o build e recarregue a extensão após mudar o endereço da API.
2. Em `chrome://extensions`, ative o **Modo do desenvolvedor**, clique em **Carregar sem compactação** e selecione `system/extension/dist/`.
3. Abra uma página comum da web e entre com Google ou e-mail e senha no painel. Se precisar abrir a caixa de e-mail para ler o código de cadastro, reabra o painel para continuar de onde parou enquanto o Chrome estiver aberto. [Configuração de e-mail](../backend/README.md#login-por-e-mail) · [Testes de login](../../docs/relatorios_testes/login.md)
4. Clique em **Ler texto da aba** e revise a prévia. A confirmação aciona a análise. Para testar apenas a sessão, use **Abrir histórico**.

O projeto Supabase AutenticAI já aceita o retorno `https://cneblicgbokemnhohbkepapiahgfnmgh.chromiumapp.org/google`. Em outro projeto, cadastre a mesma URL no Supabase Auth. No Worker, inclua `chrome-extension://cneblicgbokemnhohbkepapiahgfnmgh` em `ALLOWED_ORIGINS` e reinicie a API local. A chave do manifesto é pública e mantém o identificador da extensão descompactada.

O painel lê a aba ativa apenas quando solicitado. O Chrome bloqueia a leitura de algumas páginas, como `chrome://extensions`. Se precisar fechar o painel durante uma análise, consulte o histórico ao voltar.
