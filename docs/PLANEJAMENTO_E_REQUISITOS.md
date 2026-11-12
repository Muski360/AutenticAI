# Planejamento e Levantamento de Requisitos — AutenticAI

## 1. Problema e proposta

A disseminação de informações falsas e conteúdos manipulados dificulta a identificação de fontes confiáveis na internet. A verificação dessas informações frequentemente exige consultas a diferentes ferramentas e fontes.

O **AutenticAI** propõe uma plataforma integrada de verificação de informações, disponível via Web, extensão Chrome e aplicativo Android. O sistema utilizará inteligência artificial e consultas a fontes externas para identificar afirmações verificáveis, avaliar evidências e apresentar resultados fundamentados.

A solução também prevê a identificação de indícios de conteúdos gerados por IA, sem confundir a origem do conteúdo com sua veracidade.

## 2. Escopo do projeto

| Plataforma | Funcionalidades previstas |
|---|---|
| **Web** | Análise de textos, URLs e imagens, visualização de relatórios e histórico. |
| **Extensão Chrome** | Extração e análise do conteúdo da página ativa, mediante solicitação. |
| **Android** | Captura autorizada da tela, extração de texto e solicitação de análise. |
| **Backend** | Processamento assíncrono, consulta a fontes, integração com IA e armazenamento de resultados. |

## 3. Requisitos funcionais (RF)

| ID | Requisito | Especificação |
|---|---|---|
| RF01 | Autenticação | Permitir cadastro, login, recuperação de acesso e gerenciamento da sessão. |
| RF02 | Envio de conteúdo | Receber textos, URLs HTTP(S) e imagens pela plataforma web para análise. |
| RF03 | Captura contextual | Permitir análise da página ativa no Chrome e captura pontual da tela no Android, mediante autorização. |
| RF04 | Confirmação de análise | Exibir prévia do conteúdo selecionado e solicitar confirmação antes do envio. |
| RF05 | Verificação factual | Identificar afirmações verificáveis, consultar fontes externas e avaliar evidências relacionadas. |
| RF06 | Relatório de resultados | Classificar afirmações como sustentadas, contraditas, com evidências mistas ou inconclusivas, apresentando justificativas e fontes consultadas. |
| RF07 | Detecção de IA | Apresentar estimativas de conteúdo sintético em seção independente, quando houver detector compatível disponível. |
| RF08 | Histórico de análises | Permitir consultar relatórios anteriores, acompanhar solicitações e excluir registros próprios. |
| RF09 | Processamento assíncrono | Registrar análises em fila, acompanhar seu estado e informar conclusão, falhas ou resultados parciais. |

## 4. Requisitos não funcionais (RNF)

| ID | Categoria | Especificação |
|---|---|---|
| RNF01 | Segurança | Utilizar autenticação segura, HTTPS em produção e controle de acesso aos dados de cada usuário. |
| RNF02 | Privacidade | Realizar análises somente sob solicitação, minimizar dados enviados e descartar capturas temporárias conforme a política de retenção. |
| RNF03 | Desempenho | Retornar a confirmação do recebimento da análise em até 2 segundos como meta inicial, mantendo o processamento em segundo plano. |
| RNF04 | Confiabilidade | Implementar tratamento de falhas, tentativas controladas de reprocessamento e identificação de resultados inconclusivos. |
| RNF05 | Acessibilidade | Seguir WCAG 2.2 nível AA como referência, garantindo navegação por teclado, contraste adequado e adaptação a diferentes telas. |
| RNF06 | Manutenibilidade | Adotar arquitetura modular, API REST documentada e ambientes reproduzíveis com Docker. |

## 5. Tecnologias previstas

| Camada | Tecnologias |
|---|---|
| Frontend Web | Next.js, React e TypeScript |
| Aplicativo Android | Flutter e Dart |
| Extensão Chrome | TypeScript e Manifest V3 |
| Backend | NestJS e TypeScript |
| Banco de dados | PostgreSQL e Prisma ORM |
| Filas e cache | Redis e BullMQ |
| Inteligência artificial | APIs de modelos de linguagem e serviços de busca |
| Infraestrutura | Docker, Docker Compose e hospedagem a definir |

## 6. Etapas de desenvolvimento

| Fase | Entregas principais |
|---|---|
| **1. Estruturação** | Configuração do ambiente, banco de dados, API, autenticação e infraestrutura inicial. |
| **2. Plataforma Web** | Envio de conteúdos, processamento de análises, relatórios e histórico. |
| **3. Extensão Chrome** | Captura contextual de páginas e integração com a API de análise. |
| **4. Aplicativo Android** | Captura autorizada da tela, extração local de texto e consulta de resultados. |
| **5. Validação e implantação** | Testes funcionais, segurança, controle de custos e disponibilização de piloto controlado. |

## 7. Delimitação do MVP

O MVP priorizará a **verificação factual fundamentada em fontes externas**, com suporte a textos, URLs e extração de informações de imagens.

A detecção especializada de conteúdo gerado por IA será opcional, condicionada à disponibilidade e à validação de ferramentas adequadas.

Funcionalidades como análise de vídeos completos, monitoramento contínuo e planos comerciais permanecerão fora do escopo inicial.

O projeto será considerado validado inicialmente quando os fluxos principais de análise, consulta de resultados e proteção dos dados forem testados em ambiente controlado.