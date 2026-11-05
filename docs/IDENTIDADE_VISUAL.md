# Identidade Visual e Diretrizes de Interface — AutenticAI

## Direção visual

Aplicar uma interface minimalista, moderna e responsiva, com superfícies brancas, azul como cor de identidade e ações, e elementos neutros para leitura e organização. A composição deve transmitir segurança, confiabilidade, neutralidade e transparência.

A hierarquia principal dos resultados é **afirmação → classificação → justificativa → fontes**. Manter esses elementos visualmente associados e em ordem de leitura consistente. Não representar resultados como garantias absolutas.

O projeto está em planejamento. Esta especificação define a direção inicial das interfaces web, extensão Chrome e aplicativo Android; sua aplicação deve ser validada em protótipos.

## Marca

- Grafia oficial: **AutenticAI**.
- Até a criação de um símbolo aprovado, apresentar o nome em texto, com Inter 600 e cor `#123C70` sobre fundo claro.
- Não utilizar selos de verificação ou escudos como marca provisória. O símbolo definitivo e suas aplicações permanecem pendentes.

## Cores

Usar as cores por função, mantendo o branco como fundo predominante. Reservar cores semânticas para estados e feedbacks; acompanhar cada estado de texto descritivo.

| Token | Valor | Aplicação |
|---|---|---|
| `background` | `#FFFFFF` | Fundo principal, campos e cartões |
| `surface-secondary` | `#F2F6FC` | Fundos secundários e áreas de apoio |
| `primary` | `#1557B0` | Botão primário, links e foco |
| `primary-hover` | `#123C70` | Interação de botão ou link primário |
| `text-primary` | `#172B4D` | Títulos e texto principal |
| `text-secondary` | `#52647A` | Texto auxiliar e estado inconclusivo |
| `border` | `#D5DFEB` | Bordas e divisores decorativos |
| `success` | `#16704A` | Afirmação sustentada |
| `danger` | `#A23535` | Afirmação contradita e mensagens de erro |
| `warning` | `#805900` | Evidências mistas e avisos |

Usar texto branco sobre `primary` e `primary-hover`. Usar as cores semânticas como texto ou ícone sobre branco, acompanhadas de rótulo. A borda `border` é decorativa; não depender dela isoladamente para identificar campos ou estados. Não aplicar texto branco sobre fundos claros.

## Tipografia

Usar **Inter** para títulos, textos, controles e dados. Na web, definir a pilha `Inter, system-ui, sans-serif`. Utilizar a fonte de sistema quando Inter não estiver disponível; verificar licença e suporte a português antes da distribuição.

| Estilo | Tamanho desktop / móvel | Peso | Entrelinha |
|---|---|---:|---:|
| Título de página | 40 / 32 px | 700 | 1,2 |
| Título de seção | 28 / 24 px | 600 | 1,25 |
| Subtítulo | 20 / 18 px | 600 | 1,3 |
| Corpo | 16 px | 400 | 1,5 |
| Apoio | 14 px | 400 | 1,5 |
| Botão e rótulo | 16 px | 600 | 1,25 |

Manter alinhamento à esquerda e caixa normal. Limitar texto corrido a aproximadamente 75 caracteres por linha. Permitir quebra de títulos, ampliação de texto e adaptação às configurações de fonte do sistema.

## Layout e espaçamento

- Adotar escala de espaçamento em múltiplos de 4 px: `4`, `8`, `12`, `16`, `24`, `32` e `48 px`.
- Na web, limitar o conteúdo principal a `1200 px`, centralizado. Aplicar margem lateral de `16 px` em telas menores que `768 px` e `24 px` a partir desse ponto.
- Abaixo de `768 px`, utilizar uma coluna. A partir de `768 px`, usar duas colunas apenas quando houver espaço para apresentar afirmação e evidências sem comprometer a leitura.
- Em telas pequenas e na extensão, empilhar conteúdo, ações e resultados; evitar rolagem horizontal da página. Preservar a mesma ordem visual e semântica em todos os tamanhos.
- No Android, adaptar as medidas à densidade e às preferências de texto do sistema, preservando hierarquia e espaçamento equivalentes.

## Componentes

| Componente | Especificação |
|---|---|
| Botão primário | Fundo `primary`, texto branco, raio de `8 px`, altura mínima de `44 px` e espaçamento horizontal de `16 px`. No hover, usar `primary-hover`. |
| Botão secundário | Fundo branco, texto e borda `primary`, com dimensões equivalentes ao botão primário. |
| Link | Cor `primary` e sublinhado para identificação independente da cor. Preservar indicação de foco. |
| Campo | Fundo branco, raio de `8 px`, altura mínima de `44 px`, rótulo visível e texto de ajuda quando necessário. Indicar erro com mensagem junto ao campo. |
| Cartão | Fundo branco, borda de `1 px` em `border`, raio de `8 px` e espaçamento interno de `24 px`; usar `16 px` em telas estreitas. |
| Divisor | Linha de `1 px` em `border`, utilizada apenas para separar grupos relacionados. |
| Ícone | Traço simples e consistente, tamanho padrão de `20 px`. Ações com apenas ícone devem ter nome acessível. |

Em controles interativos, exibir foco visível com contorno de `2 px` em `primary` e afastamento de `2 px` sobre superfícies claras. Não remover o indicador nativo sem fornecer alternativa equivalente. Definir estados de hover, foco, pressionado e desabilitado sem depender exclusivamente de cor; informar por texto quando uma ação estiver indisponível e o motivo não for evidente.

## Fluxo e estados da análise

1. Apresentar o conteúdo selecionado e a ação de análise. Antes do envio, exibir uma prévia e informar o conteúdo que será compartilhado, especialmente em páginas e capturas de tela.
2. Durante o processamento, apresentar indicador e texto de andamento. Não informar prazo de conclusão sem medição.
3. Para cada afirmação, apresentar classificação textual, justificativa e fontes disponíveis. Usar os rótulos “Sustentado”, “Contradito”, “Evidências mistas” e “Inconclusivo”.
4. Apresentar a análise de indícios de IA em seção separada. Quando indisponível, informar esse estado; uma estimativa não comprova autoria.
5. Em estados vazios, erros e permissões negadas, descrever a situação e oferecer uma próxima ação quando disponível. Não comunicar resultados apenas por cor ou ícone.

## Interação e acessibilidade

- Usar HTML semântico e controles nativos na web sempre que possível. Manter ordem de foco coerente com a leitura e disponibilizar todas as ações por teclado e toque.
- Reservar área de interação de pelo menos `44 × 44 px` para controles; no Android, aplicar os equivalentes de plataforma.
- Garantir contraste mínimo de `4,5:1` para texto normal e `3:1` para texto grande; verificar também contraste de controles e indicadores de foco contra as superfícies adjacentes.
- Anunciar alterações relevantes de estado para tecnologias assistivas, sem interromper desnecessariamente a leitura.
- Usar transições discretas para feedback de interação; respeitar `prefers-reduced-motion` na web e a configuração equivalente no Android. Conteúdo e ações devem funcionar sem animações.
- Usar linguagem direta e precisa. Para resultados inconclusivos, preferir “Não encontramos evidências suficientes”; não utilizar afirmações como “100% verdadeiro” ou “proteção total”.

## Verificação de implementação

Validar os componentes em telas estreitas, intermediárias e amplas; testar zoom, teclado, toque, leitor de tela, carregamento sem a fonte e preferência por movimento reduzido. Conferir contraste em todas as combinações efetivamente utilizadas e revisar estados de carregamento, erro, vazio e permissão negada.