# Instruções para agentes — AutenticAI

## Como trabalhar

- Responda em português brasileiro, com linguagem direta. Comece pela resposta ou próxima ação, informe o progresso e apresente estimativas de tempo concretas quando úteis.
- Numere tarefas com várias etapas, limite listas visíveis a cinco itens e termine com uma próxima ação concreta. Informe erros, causas e correções diretamente.
- Leia os arquivos envolvidos e preserve alterações existentes antes de editar. Faça a menor mudança que resolva o pedido, sem adicionar funcionalidades ou dependências desnecessárias.
- Mantenha a documentação clara e enxuta. Descreva o que o projeto faz; não liste tecnologias ausentes nem use a quantidade prevista de usuários como requisito de produto.
- Verifique as mudanças conforme o tipo de tarefa e informe o que foi testado e o que não foi. Não afirme que uma funcionalidade planejada já está pronta.

## Contexto do projeto

O AutenticAI é um projeto acadêmico do SENAI para ajudar pessoas a investigar informações. O usuário solicita a análise, revisa o conteúdo e recebe justificativas e fontes disponíveis. Os indícios de conteúdo gerado por IA são separados da verificação factual, sem percentual ou certeza de autoria.

O protótipo em `prototype/` é uma demonstração em HTML, CSS e JavaScript. A pasta `system/backend/` contém a API do Cloudflare Workers, as migrações PostgreSQL e a configuração do Supabase e do Gemini 3.5 Flash com pesquisa. Os clientes planejados usam Next.js, extensão Chrome e Flutter para Android. A API oferece o nível Light. Médio, Alto e Ultra são conceituais.

No Android, sobreposição e captura de tela exigem autorizações distintas. O usuário inicia a captura e confirma o envio; respeite as restrições de telas protegidas. Mantenha segredos no servidor, restrinja o histórico ao usuário e não armazene o print original permanentemente.

## Onde encontrar informações

- `README.md`: visão geral e situação atual.
- `docs/PLANEJAMENTO_E_REQUISITOS.md` e `docs/REQUISITOS_E_PROTOTIPAGEM.md`: requisitos e fluxos.
- `docs/ARQUITETURA.md` e `docs/DER.md`: arquitetura, permissões e modelo de dados proposto.
- `docs/IDENTIDADE_VISUAL.md` e `docs/IDENTIFICACAO_DO_PROBLEMA.md`: interface, problema e referências.
- `prototype/README.md`: execução, limitações e verificação do protótipo; `assets/` contém a marca.

Ao mudar uma decisão de produto ou arquitetura, atualize os documentos relacionados. Não use o protótipo antigo como fonte de requisitos quando ele divergir da documentação atual.

## Execução e verificação

Para visualizar o protótipo, execute `python -m http.server 8080` na raiz e abra `http://localhost:8080/prototype/`. Para mudanças na interface, verifique os fluxos afetados, responsividade, teclado e erros de console; use o smoke test e as instruções de `prototype/README.md` quando aplicável. Para mudanças apenas em Markdown, confira links internos, coerência e `git diff --check`.

Para mudanças na API, execute `npm test` e `npm run check` em `system/backend/`. A configuração local está no [guia do backend](system/backend/README.md).

## Skills e ferramentas

Confira as skills e MCPs disponíveis na sessão: podem variar entre ambientes. Leia o `SKILL.md` correspondente antes de usar uma skill e siga as instruções da ferramenta; não suponha que uma integração esteja instalada ou autenticada.

- **Código e revisão:** use `ponytail:ponytail` para mudanças simples e completas; `ponytail:ponytail-review` para revisão de alterações. Para texto, considere `stop-slop`.
- **Interface:** `frontend-skill` para interfaces visuais; `awwwards-skill` para direção visual ou reformulação substancial; `playwright` para automação pelo terminal. Use a skill apropriada de Figma quando a tarefa envolver Figma.
- **Documentação técnica:** use o MCP Context7 para consultar documentação atual de bibliotecas e frameworks; confirme comportamento e limitações em fontes oficiais quando necessário, especialmente Android, Gemini, Supabase e Cloudflare.
- **Ferramentas externas:** MCP Playwright pode inspecionar e testar páginas; Figma apoia tarefas de design; GitHub apoia tarefas no repositório remoto. Descubra as ferramentas disponíveis antes de usá-las e respeite o escopo solicitado.
- **Outras necessidades:** consulte o catálogo da sessão para skills de imagem, vídeo, sites ou outros domínios apenas quando forem relevantes. Não publique, envie mensagens ou altere serviços externos sem autorização apropriada.
