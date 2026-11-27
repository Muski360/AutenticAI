# Arquitetura — AutenticAI

## Objetivo e escopo

O AutenticAI é um projeto acadêmico de análise de informações. A API e a migração do banco estão em `system/backend/`. O projeto remoto do Supabase já tem o esquema inicial do histórico. Os clientes usam Supabase Auth para Google com PKCE ou e-mail e senha. Eles enviam ao Worker apenas o token de acesso da sessão. A extensão usa `activeTab` para ler o texto após solicitação. O Android usa `MediaProjection` para a captura iniciada pelo botão flutuante.

Em desenvolvimento, o Worker e os três clientes usam `system/backend/.env`. As variáveis de `system/backend/.env.local` têm prioridade quando esse arquivo existe. Os clientes recebem apenas os endereços e a chave publicável do Supabase. As chaves da Groq e da Tavily ficam no Worker. [Guia do backend](../system/backend/README.md)

| Caminho | Responsabilidade |
|---|---|
| `system/backend/api/` | Rotas e autenticação em `worker.js`, leitura de entradas em `input.js` e integração com Groq e Tavily em `analysis.js`. |
| `system/analysis-client.mjs` | Requisições autenticadas e tratamento de erros na web e na extensão. |
| `system/password-auth.mjs` | Login, cadastro e verificação de código no Supabase para web e extensão. |
| `system/web/app/components/` | Componentes de marca e do espaço de análise. |
| `system/extension/assets/` | Ícone e fonte incluídos no build da extensão. |
| `system/mobile/lib/` | Cliente HTTP com respostas tipadas em `analysis_api.dart`, tela de trabalho e visualização do relatório. |

```mermaid
flowchart LR
    W[Web: Next.js] --> API[API: Cloudflare Worker]
    C[Extensão Chrome] --> API
    A[Android: Flutter] --> API
    API --> G[Groq: transcrição e análise]
    API --> T[Tavily: pesquisa de fontes]
    API --> DB[(PostgreSQL no Supabase)]
    W --> AUTH[Supabase Auth: Google ou e-mail e senha]
    C --> AUTH
    A --> AUTH
    API --> AUTH
```

A web Next.js é exportada como arquivos estáticos e servida por um Worker. O Worker da API valida a sessão, chama Groq e Tavily e grava o relatório no Supabase. As duas chaves de API ficam no Worker. [Publicação da web](../system/web/README.md#publicação-no-cloudflare) · [Publicação da API](../system/backend/README.md#publicação-no-cloudflare)

O Worker trata redirecionamentos dos provedores como falhas e mantém o token da sessão e as chaves restritos aos destinos configurados. [Redirecionamentos no Cloudflare Workers](https://developers.cloudflare.com/workers/runtime-apis/request/#properties)

O cadastro por e-mail envia um código de confirmação pelo Supabase. A pessoa digita o código no cliente onde iniciou o cadastro. O Worker valida o token no Supabase e aceita sessões Google ou e-mail. As políticas do PostgreSQL continuam usando o ID do usuário para restringir o histórico ao proprietário. [Configuração do e-mail e do modelo de confirmação](../system/backend/README.md#login-por-e-mail)

## Fluxo de análise

1. O usuário entra com Google ou e-mail e senha e seleciona o conteúdo na web, na extensão ou no Android.
2. O cliente mostra uma prévia e pede confirmação antes do envio. Web e Android aceitam texto digitado ou print escolhido. O Android também aceita um print capturado com autorização, e a extensão extrai texto da página ativa.
3. O Worker valida a sessão e a entrada. Para um print, a Groq transcreve a imagem com `qwen/qwen3.8-27b`. A Tavily faz uma busca básica com os primeiros 400 caracteres e retorna até cinco fontes. A Groq analisa o texto e os trechos retornados com `openai/gpt-oss-120b`.
4. O resultado apresenta até cinco afirmações com justificativas e referências aos links da Tavily. Quando faltam evidências, o relatório informa a limitação ou classifica a afirmação como inconclusiva. Se um provedor falhar, a API retorna uma mensagem de erro.
5. O histórico salva o texto enviado ou extraído da imagem, o resultado e as fontes, vinculados ao usuário. O print original não é armazenado permanentemente. Cada usuário pode consultar e excluir seus próprios registros.

O usuário revisa o conteúdo e confirma o envio. O banco restringe o histórico à conta que criou o relatório. As cotas da Groq e da Tavily limitam a quantidade de análises. Uma busca pelos primeiros 400 caracteres pode deixar afirmações posteriores sem evidências.

Os clientes aguardam até 135 segundos no envio da análise para acomodar a sequência de chamadas de um print. A consulta e a exclusão de histórico têm prazo de 25 segundos.

O modelo de dados do histórico está no [diagrama entidade-relacionamento](DER.md).

## Android: botão flutuante e captura

O Flutter apresenta a interface; a integração nativa Android implementa a sobreposição e a captura. As permissões são diferentes: **aparecer sobre outros apps** permite mostrar o botão flutuante, mas não autoriza ler a tela.

1. O usuário habilita a sobreposição nas configurações do Android e toca no botão flutuante para iniciar uma análise.
2. O aplicativo solicita o consentimento de captura com `MediaProjection`. O Android exige novo consentimento para cada sessão de captura; não há captura silenciosa.
3. Após o consentimento, a integração usa um serviço em primeiro plano do tipo `mediaProjection`, com as declarações exigidas pela versão do Android. Captura uma imagem, encerra a sessão e exibe a prévia para confirmação.
4. Se o usuário negar uma permissão ou a tela estiver protegida, o app explica o impedimento e não envia conteúdo. Algumas telas protegidas podem aparecer vazias ou não ser capturáveis.

A captura não fica ativa continuamente. Detalhes e requisitos variam com a versão e o SDK alvo: [MediaProjection — Android Developers](https://developer.android.com/media/grow/media-projection).

## Resultado e níveis de análise

A verificação factual e os indícios de conteúdo gerado por IA aparecem em seções separadas. A Groq pode descrever sinais observados. Esses sinais não comprovam autoria e não são apresentados em porcentagem.

| Nível | Situação | Ideia para profundidade, tempo e custo |
|---|---|---|
| **Light (Leve)** | Nível da API, com Groq e Tavily | Análise inicial com uma busca de fontes. |
| **Médio** | Visão futura | Investigação mais ampla que a Light. |
| **Alto** | Visão futura | Investigação mais aprofundada, com maior tempo e custo. |
| **Ultra** | Visão futura | Investigação mais extensa, com maior tempo e custo previstos. |

Os níveis futuros não têm modelos ou recursos contratados e não garantem maior veracidade. Em todos os casos, a conclusão depende das evidências encontradas.

## Referências técnicas

- [Captura de tela no Android](https://developer.android.com/media/grow/media-projection)
- [Groq GPT-OSS 120B](https://console.groq.com/docs/model/openai/gpt-oss-120b) e [Tavily Search](https://docs.tavily.com/documentation/api-reference/endpoint/search)
- [Exportação estática do Next.js](https://nextjs.org/docs/app/guides/static-exports) e [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Login Google no Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google)
