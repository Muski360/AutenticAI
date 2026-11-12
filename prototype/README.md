# AutenticAI — Protótipo visual

Protótipo independente em **HTML, CSS e JavaScript puro**, inspirado nas diretrizes de direção de arte do projeto `awwwards-skill` e na identidade visual de `docs/IDENTIDADE_VISUAL.md` do AutenticAI.

## Executar

Abra `index.html` em um navegador moderno. Não é preciso instalar dependências, executar um servidor ou configurar variáveis de ambiente.

Para testar rotas também é possível usar um servidor local opcional:

```bash

```

Depois, acesse `http://localhost:8080`.

## Conteúdo

- `index.html`: landing page, mockups da plataforma, área interna, diálogos e elementos de interface.
- `styles.css`: identidade visual, composição editorial, responsividade, animações e estados.
- `script.js`: navegação de demonstração, abas, validações locais, prévia, simulação de relatório e feedbacks.

## O que explorar

1. Role a **landing page**: manifesto, método, visualização de relatório, plataformas e princípios de privacidade.
2. Clique em **Explorar protótipo** ou **Fazer uma análise** para visitar a aplicação simulada.
3. Alterne entre texto/link/imagem, insira conteúdo e clique em **Revisar conteúdo**.
4. Confira a prévia; em seguida, clique em **Ver relatório de exemplo**.
5. Use os exemplos "A Lua emite luz própria" e "O Sol é uma estrela" para visualizar duas classificações didáticas. Para qualquer outra entrada, a interface apresenta um relatório explicitamente não verificado.
6. Explore **Histórico**, **Configurações** e a navegação mobile.

## Limitações intencionais

**Este protótipo não faz fact-checking**, detecção de IA, OCR, captura de tela, requisições a serviços externos, login, upload de imagens, armazenamento, rastreamento ou qualquer tratamento remoto de dados do usuário. Uma imagem selecionada só tem prévia local no navegador. Os relatórios e fontes são exemplos demonstrativos, identificados como tais em toda a interface.

O Google Fonts é opcional e usado exclusivamente para carregar a família Inter; a interface continua funcional com `system-ui` se a fonte externa estiver indisponível.

## Regras de identidade respeitadas

- Marca textual AutenticAI (sem inventar símbolo oficial)
- Inter e hierarquia tipográfica responsiva
- `#FFFFFF`, `#F2F6FC`, `#1557B0`, `#123C70`, `#172B4D`, `#52647A`, `#D5DFEB`
- Verde, vermelho e amarelo reservados a estados semânticos
- Foco visível, controles acessíveis e alternativas a movimento
- Fluxo de confirmação antes de análise; separação entre fatos e detecção de IA

## Próxima etapa

O design pode servir de base para implementar a Web com React/TypeScript e o Android com Flutter, preservando componentes e tokens enquanto o backend ainda é construído.
