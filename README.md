# AutenticAI

O AutenticAI é um projeto acadêmico do SENAI que ajuda a investigar informações encontradas na internet. A Tavily pesquisa fontes, e a Groq analisa o conteúdo com base nos trechos encontrados.

O [protótipo visual](prototype/README.md) demonstra os fluxos planejados. A [web](system/web/README.md), a [extensão Chrome](system/extension/README.md) e o [app Android](system/mobile/README.md) usam a mesma [API](system/backend/README.md). O fluxo de análise com Groq e Tavily foi validado na web local com login Google e histórico no Supabase. [Relatório de testes](docs/relatorios_testes/groq_tavily.md)

A [web publicada](https://autenticai-web.muski.workers.dev/) e a [API no Cloudflare](https://autenticai-api.muski.workers.dev/health) usam o Supabase do projeto. A publicação da versão com Groq e Tavily está pendente.

## Como será usado

| Plataforma | Entrada para análise |
|---|---|
| **Web — Next.js** | Texto digitado ou print enviado pelo usuário. |
| **Extensão Chrome** | Texto da página ativa, quando o usuário solicitar. |
| **Android — Flutter** | Texto digitado, print escolhido ou captura iniciada pelo botão flutuante com autorização do Android. |

Antes de enviar, o usuário poderá revisar o conteúdo. A análise mostrará afirmações, justificativas e fontes disponíveis. Também poderá apontar **indícios** de conteúdo criado por IA, sem percentual ou confirmação de autoria. O resultado pode estar errado ou ser inconclusivo; consulte as fontes.

## Tecnologias

- **Aplicação e API:** Next.js e Cloudflare Workers.
- **Mobile:** Flutter, com integração nativa Android para a captura de tela.
- **Extensão:** Chrome, com Manifest V3.
- **Conta e dados:** Google ou e-mail e senha pelo Supabase Auth, com histórico no PostgreSQL.
- **Análise e pesquisa:** Groq (`openai/gpt-oss-120b`) e Tavily Search.

## Níveis de análise

O projeto oferece o nível **Light (Leve)**, com uma busca básica por análise. Os níveis **Médio, Alto e Ultra** são propostas para investigações mais profundas.

## Documentação

A [arquitetura](docs/ARQUITETURA.md) descreve a organização do código. Os [relatórios de testes](docs/relatorios_testes/) registram as validações do projeto.

Veja a [configuração do login por e-mail](system/backend/README.md#login-por-e-mail) e os [testes de login](docs/relatorios_testes/login.md).

- [Problema e referências](docs/IDENTIFICACAO_DO_PROBLEMA.md)
- [Planejamento e requisitos](docs/PLANEJAMENTO_E_REQUISITOS.md)
- [Diagrama entidade-relacionamento](docs/DER.md)
- [Fluxos e prototipagem](docs/REQUISITOS_E_PROTOTIPAGEM.md)
- [Identidade visual](docs/IDENTIDADE_VISUAL.md)
