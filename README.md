# AutenticAI

O AutenticAI é um projeto acadêmico do SENAI que ajuda a investigar informações encontradas na internet. O usuário envia um conteúdo, e a IA pesquisa fontes e apresenta uma análise com explicações e limitações.

**Situação:** o [protótipo visual](prototype/README.md) é demonstrativo. A API e a migração do banco estão em `system/backend/`. Consulte o [guia do backend](system/backend/README.md) para configurar e executar a API.

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
- **IA:** Gemini 3.5 Flash, com pesquisa de fontes.

## Níveis de análise

O projeto oferece o nível **Light (Leve)**, configurado com Gemini 3.5 Flash. A Google redireciona esse identificador para o Gemini 3.6 Flash. Em um produto futuro, os níveis **Médio, Alto e Ultra** poderiam oferecer investigações progressivamente mais profundas, demoradas e caras. [Notas da Gemini API](https://aistudio.google.com/docs/changelog#10-08-2026)

## Documentação

- [Problema e referências](docs/IDENTIFICACAO_DO_PROBLEMA.md)
- [Planejamento e requisitos](docs/PLANEJAMENTO_E_REQUISITOS.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Diagrama entidade-relacionamento](docs/DER.md)
- [Fluxos e prototipagem](docs/REQUISITOS_E_PROTOTIPAGEM.md)
- [Identidade visual](docs/IDENTIDADE_VISUAL.md)
