# AutenticAI

O AutenticAI é um projeto acadêmico do SENAI que ajuda a investigar informações encontradas na internet. O usuário envia um conteúdo, e a IA pesquisa fontes e apresenta uma análise com explicações e limitações.

**Situação:** projeto em planejamento. Existe um [protótipo visual](prototype/README.md), mas ainda não há análise real, autenticação ou backend implementados.

## Como será usado

| Plataforma | Entrada para análise |
|---|---|
| **Web — Next.js** | Texto digitado ou print enviado pelo usuário. |
| **Extensão Chrome** | Texto da página ativa, quando o usuário solicitar. |
| **Android — Flutter** | Print da tela iniciado por um botão flutuante, com autorização do Android. |

Antes de enviar, o usuário poderá revisar o conteúdo. A análise mostrará afirmações, justificativas e fontes disponíveis. Também poderá apontar **indícios** de conteúdo criado por IA, sem percentual ou confirmação de autoria. O resultado pode estar errado ou ser inconclusivo; consulte as fontes.

## Tecnologias

- **Aplicação e API:** Next.js e Cloudflare Workers.
- **Mobile:** Flutter, com integração nativa Android para a captura de tela.
- **Extensão:** Chrome, com Manifest V3.
- **Conta e dados:** login Google pelo Supabase Auth e PostgreSQL no Supabase.
- **IA:** Gemini 2.5 Flash-Lite, com pesquisa de fontes.

## Níveis de análise

O projeto implementará somente o **Light (Leve)**, com Gemini 2.5 Flash-Lite. Em um produto futuro, os níveis **Médio, Alto e Ultra** poderiam oferecer investigações progressivamente mais profundas, demoradas e caras. Eles são apenas uma visão conceitual, sem implementação ou modelos definidos.

## Documentação

- [Problema e referências](docs/IDENTIFICACAO_DO_PROBLEMA.md)
- [Planejamento e requisitos](docs/PLANEJAMENTO_E_REQUISITOS.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Diagrama entidade-relacionamento](docs/DER.md)
- [Fluxos e prototipagem](docs/REQUISITOS_E_PROTOTIPAGEM.md)
- [Identidade visual](docs/IDENTIDADE_VISUAL.md)
