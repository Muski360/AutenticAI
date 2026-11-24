# AutenticAI — Protótipo visual

> Este protótipo representa uma versão anterior da interface. A opção de link e os exemplos de resultado são demonstrativos e não definem o escopo atual; consulte os [requisitos atualizados](../docs/PLANEJAMENTO_E_REQUISITOS.md).

Landing page e aplicação demonstrativa em **HTML, CSS e JavaScript puro**, sem build ou dependências de execução.

## Executar

Abra `prototype/index.html` em um navegador moderno, mantendo `prototype/` e `assets/` como pastas irmãs.

Para servir o projeto localmente, execute **na raiz do repositório**:

```bash
python -m http.server 8080
```

Acesse **http://localhost:8080/prototype/**. Não é preciso instalar pacotes ou configurar variáveis de ambiente.

## Explorar

1. Percorra a landing: proposta, método, relatório ilustrativo, plataformas e privacidade.
2. Abra a aplicação e visite suas cinco telas: visão geral, nova análise, relatório, histórico e configurações.
3. Alterne entre texto, link e imagem; revise o conteúdo antes de abrir o relatório demonstrativo.
4. Use os exemplos da Lua e do Sol para explorar classificações didáticas. Outras entradas permanecem explicitamente sem verificação.
5. Navegue por teclado: há link para pular ao conteúdo, foco no título ao trocar de tela e abas com setas. O movimento reduzido respeita a preferência do sistema e a opção local.

## Direção visual

Composição editorial branca, azul profundo e ciano, com títulos diretos e divisores discretos. A marca usa os PNGs em `../assets/`. A abertura mostra uma afirmação e sua classificação, com um atalho para o relatório de exemplo.

Foi considerada uma abertura escura e imersiva. A composição branca foi escolhida para favorecer leitura e neutralidade, com o símbolo ciano como ponto de identidade na visualização.

- [Are.na](https://www.are.na/): inspeção visual real em desktop; referência para espaço em branco, hierarquia e agrupamento por contexto.
- [AFP — How we work](https://factcheck.afp.com/How-we-work): leitura da metodologia; referência para separar afirmação, evidência, fonte e limites.

A pesquisa no Awwwards ficou indisponível por timeout; não houve inspeção visual desse site. A skill `awwwards-skill` orientou o processo de direção e revisão.

## Arquivos e limites

- `index.html`: landing, cinco telas internas, mockups e diálogo de revisão.
- `styles.css`: composição, identidade, estados e layouts responsivos.
- `script.js`: navegação, abas, prévia local e relatórios demonstrativos.

**Não há backend, fact-checking, detecção real de IA, conta ou upload remoto.** Imagens selecionadas ficam apenas na prévia local; relatórios, histórico e fontes são exemplos. Nenhuma informação é armazenada ou enviada para análise.

O Google Fonts carrega Inter opcionalmente; a interface usa a fonte do sistema quando o serviço está indisponível.

## Verificação

Com o servidor local ativo e o Node.js instalado, execute na raiz:

```powershell
npx --yes --package @playwright/cli playwright-cli -s=autenticai open http://localhost:8080/prototype/ --browser chrome
npx --yes --package @playwright/cli playwright-cli -s=autenticai run-code --filename prototype/checks/smoke.js
```

O smoke check verifica 24 combinações de tela e largura (320, 390, 768 e 1440 px), imagens, foco, abas por teclado, diálogo, entrada sem verificação, movimento reduzido e leitura sem JavaScript/fonte externa. Não substitui testes em dispositivos reais.
