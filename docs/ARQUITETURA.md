# AutenticAI — Arquitetura de Software

> **Documento técnico de referência · Versão 1.0 · 03/11/2026**  
> **Estado:** arquitetura proposta, sujeita a validação por protótipo e testes  
> **Produto:** plataforma brasileira de verificação de fatos e investigação de indícios de uso de inteligência artificial  
> **Tese:** *Proteção real, a qualquer hora, em qualquer lugar, contra fake news.*

---

## 0. Resumo executivo

O **AutenticAI** será uma plataforma de verificação **sob demanda**, composta por três clientes — **aplicação Web**, **extensão para Chrome** e **aplicativo Android** — conectados a uma **API central em NestJS**. Um usuário solicita a verificação por um botão; o sistema extrai o conteúdo autorizado, identifica alegações verificáveis, pesquisa evidências externas, sintetiza resultados com um modelo de linguagem e, separadamente, executa uma análise de possíveis indícios de geração por IA quando houver um detector adequado e habilitado.

A solução empregará um **monólito modular** em TypeScript para a camada de domínio, com **processamento assíncrono** em worker, **PostgreSQL** para persistência, **Redis** para fila e cache e **Docker** para padronizar desenvolvimento e implantação. A integração com provedores de IA será mediada por interfaces (*ports/adapters*), para suportar inicialmente um modelo econômico e, futuramente, os níveis comerciais **Light, Medium, High e Ultra**.

> **Princípios inegociáveis**
>
> 1. Nenhuma leitura contínua ou oculta da tela. Cada análise precisa ser iniciada pelo usuário.
> 2. **Veracidade factual ≠ autoria por IA.** Os resultados são independentes.
> 3. Sem evidências suficientes, a saída correta é **inconclusiva**, não “verdadeira” ou “falsa”.
> 4. Pontuações de detectores representam **estimativas do fornecedor**, não percentuais comprovados de texto escrito por IA.
> 5. Imagens e capturas brutas **não serão armazenadas permanentemente por padrão**.
> 6. Franquias gratuitas não equivalem a serviço gratuito irrestrito nem a processamento privado garantido.

## 1. Decisões aprovadas e refinamentos

| Área | Decisão de arquitetura | Estado |
|---|---|---|
| Primeiro escopo | Texto, URLs e imagens | Aprovado |
| Backend | TypeScript + NestJS | Aprovado |
| Web | Next.js | Aprovado |
| Extensão | Chrome Manifest V3 + TypeScript | Aprovado |
| Android | Flutter + integração nativa Kotlin quando necessário | Aprovado |
| Fact-checking | Sistema híbrido: checagens existentes + busca de fontes + comparação de evidências por IA | Aprovado |
| Detecção de IA | API especializada, isolada por adaptador; depende de integração e orçamento | Aprovado com ressalva |
| Dados e autenticação | PostgreSQL + autenticação central | Aprovado |
| Controle de custos | Cache, cotas, limites e pipeline em etapas | Aprovado |
| Privacidade | Preservar resultados; evitar guardar conteúdo/capturas brutas por padrão | Aprovado |
| Entrega | MVP acadêmico evoluindo para piloto público real | Refinado |
| Ambiente | Docker e Docker Compose | Aprovado |
| Organização | Monólito modular + worker do mesmo código-base | Recomendado |
| Cache e fila | Redis + BullMQ | Recomendado |
| ORM | Prisma para PostgreSQL e migrations versionadas | Recomendado |
| API | REST versionada + OpenAPI; polling de jobs | Recomendado |

### 1.1 Resolução dos conflitos de escopo

**C1 — MVP público versus IA gratuita.** Um produto público com usuários reais não pode presumir que a franquia gratuita seja suficiente ou apropriada para dados privados. **Solução:** duas configurações operacionais do mesmo sistema: `academic-pilot` (usuários de teste, dados públicos/sintéticos e cotas restritas) e `public-mvp` (revisão contratual, privacidade, orçamento e infraestrutura antes da abertura).

**C2 — Detector especializado versus orçamento zero.** Serviços especializados podem exigir pagamento. **Solução:** o detector é um módulo **opcional habilitado por feature flag**. Na sua ausência, a interface declara `not_available`; não estima percentuais com um LLM generalista como se fosse um detector validado.

**C3 — “Verificar imagens” possui dois sentidos.** No MVP, imagem significa **OCR, extração de alegações e checagem do conteúdo textual/visual verificável**. Detectar se a própria imagem foi sintetizada ou manipulada é uma capacidade separada, liberada apenas após integração e avaliação específicas.

**C4 — Proteção “em qualquer lugar” versus limites de sistema.** Chrome opera principalmente sobre páginas acessíveis na aba ativa; Android depende de consentimento de captura e pode não capturar conteúdos protegidos. O produto comunica cobertura **sob demanda e nos ambientes compatíveis**.

**C5 — Modelos mais caros não tornam um fato verdadeiro.** A qualidade de checagem depende das evidências. Modos avançados ampliam buscas, revisões e comparação de hipóteses, mas **nunca substituem fontes externas verificáveis**.

## 2. Escopo do MVP

### 2.1 Funcionalidades incluídas

- Criar conta, autenticar, encerrar sessão, recuperar acesso e gerenciar histórico.
- Submeter **texto**, **link HTTP(S)** ou **imagem** para análise explícita.
- Exibir estado da solicitação: `queued`, `processing`, `completed`, `partial`, `failed` ou `cancelled`.
- Detectar trechos com alegações passíveis de verificação; separar opinião, sátira e afirmações não verificáveis.
- Consultar checagens existentes, pesquisar evidências e registrar links, datas, contexto e trechos relevantes.
- Classificar cada alegação como `supported`, `refuted`, `mixed` ou `insufficient_evidence`.
- Mostrar **relatório factual** com fontes e justificativas, além de **relatório de autoria por IA** somente quando um detector compatível estiver disponível.
- Permitir análise do texto da aba ativa pelo Chrome mediante clique.
- Permitir captura autorizada da tela no Android e OCR local antes do envio de texto à API.
- Aplicar limites por usuário, deduplicação, cache seletivo, orçamento e auditoria de custos.
- Disponibilizar exclusão do histórico e expiração dos artefatos temporários.

### 2.2 Fora do escopo inicial

- Vídeos, áudios e monitoramento contínuo.
- Leitura silenciosa de todas as abas ou de todos os aplicativos.
- Captura de telas protegidas pelo sistema operacional.
- Detecção forense de *deepfakes* sem ferramenta especializada validada.
- Afirmação categórica de autoria por IA a partir de porcentagem.
- Moderação automática de publicações, remoção de notícias e vigilância de terceiros.
- Orquestração simultânea de múltiplos LLMs em produção; cobrança e faturamento comercial.

### 2.3 Requisitos não funcionais — metas iniciais, não garantias

| Dimensão | Meta proposta | Critério de verificação |
|---|---|---|
| Segurança | TLS em produção; autenticação e autorização por recurso | Testes de segurança e revisão de configuração |
| Latência | Feedback do job em até 2 s; duração da análise variável | P95 da criação do job |
| Confiabilidade | Reprocessamento de falhas transitórias sem cobrança/duplicação indevida | Testes de fila, idempotência e retry |
| Observabilidade | Log estruturado, métricas, identificador de correlação | Painel/consultas de logs |
| Privacidade | Não persistir capturas brutas por padrão | Testes de retenção e exclusão |
| Custos | Limite máximo de uso por usuário e orçamento por análise | Simulação de uso e bloqueio de cota |
| Acessibilidade | Interface responsiva, navegação por teclado, mensagens não dependentes só de cores | Testes de UI |
| Transparência | Veredito por alegação e lista de evidências citadas | Inspeção do relatório |
| Evolutividade | Trocar provedor de LLM sem modificar os módulos de domínio | Testes de contrato dos adaptadores |

## 3. Arquitetura lógica

### 3.1 Diagrama de contexto e componentes

```mermaid
flowchart TB
    U[Usuário] --> W[Web: Next.js]
    U --> C[Extensão Chrome MV3]
    U --> A[Android: Flutter e Kotlin]

    W -->|HTTPS REST| API[NestJS API]
    C -->|HTTPS REST| API
    A -->|HTTPS REST| API

    API --> AUTH[Identidade e autorização]
    API --> DB[(PostgreSQL)]
    API --> R[(Redis: cache e fila)]
    R --> WORKER[Worker NestJS / BullMQ]

    WORKER --> PIPE[Pipeline de verificação]
    PIPE --> FACT[Busca e checagens existentes]
    PIPE --> LLM[Gateway de modelos de IA]
    PIPE --> DET[Gateway de detectores especializados]

    FACT --> EXT1[Fact Check Tools API]
    FACT --> EXT2[Provedor de busca e fontes]
    LLM --> EXT3[Gemini / Qwen / OpenAI]
    DET --> EXT4[Serviço de detecção compatível]

    WORKER --> DB
    WORKER --> R
```

**Interpretação:** um único backend de negócio atende os três clientes. O processo HTTP e o worker podem rodar em contêineres distintos, mas usam **o mesmo repositório, contratos e módulos de domínio**. Isso **não** caracteriza uma arquitetura de microsserviços.

### 3.2 Módulos do monólito NestJS

| Módulo | Responsabilidade | Interfaces relevantes |
|---|---|---|
| `AuthModule` | Registro, login, recuperação, emissão/rotação de tokens, sessões | `AuthService` |
| `UsersModule` | Perfil, preferências, exclusão | `UserRepository` |
| `AnalysesModule` | Submissão, idempotência, status e relatórios | `AnalysisService` |
| `ContentModule` | Normalização de texto, URL, imagem, OCR e metadados | `ContentExtractor` |
| `ClaimsModule` | Identificação e classificação de alegações | `ClaimExtractor` |
| `EvidenceModule` | Consulta a checagens existentes, busca e extração das fontes | `FactCheckProvider`, `SearchProvider` |
| `FactCheckingModule` | Avaliação de cada alegação à luz das evidências | `FactVerifier` |
| `DetectionModule` | Detecção de indícios de IA, separada por modalidade | `AIDetector` |
| `AIModelsModule` | Roteamento, prompts versionados e execução de modelos | `LLMProvider`, `ModelRouter` |
| `ReportsModule` | Síntese, transparência e serialização de resultados | `ReportBuilder` |
| `UsageModule` | Quotas, custo por etapa, limites, orçamento e auditoria | `UsageMeter`, `BudgetGuard` |
| `QueueModule` | Enfileiramento, retries e concorrência | `AnalysisProcessor` |
| `PrivacyModule` | Retenção, limpeza de temporários, consentimentos e exportação | `RetentionService` |
| `ObservabilityModule` | Logs, métricas e *trace IDs* | `TelemetryService` |

**Separação interna:** `controller → application/use cases → domain/ports → infrastructure/adapters`. Evitar chamadas diretas de SDKs de IA dentro de controllers ou regras de negócio.

### 3.3 Estrutura sugerida de monorepositório

```text
autenticai/
├── apps/
│   ├── web/                   # Next.js
│   ├── chrome-extension/      # Manifest V3 + TypeScript
│   ├── api/                   # NestJS: HTTP e módulos
│   ├── worker/                # Bootstrap do processador BullMQ
│   └── android/               # Flutter + código nativo Kotlin
├── packages/
│   ├── contracts/             # OpenAPI/DTOs e clientes TS gerados
│   ├── domain/                # Tipos e regras puras de domínio
│   ├── ai-adapters/           # SDKs e adaptadores intercambiáveis
│   ├── config/                # Schemas de configuração
│   └── shared-ui/             # Componentes TypeScript quando úteis
├── infra/
│   ├── docker/
│   ├── compose.yaml
│   └── migrations/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── adr/
│   ├── threat-model.md
│   └── api-contract.md
├── .env.example
├── pnpm-workspace.yaml
└── README.md
```

**Observação:** os contratos Dart são **gerados ou mantidos como cliente separado**, pois não se compartilham diretamente pacotes TypeScript com Flutter. Um `openapi.yaml` versionado será a fonte de integração.

## 4. Fluxo de uma análise

### 4.1 Sequência completa

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuário
    participant Client as Web / Chrome / Android
    participant API as NestJS API
    participant Redis as Redis / BullMQ
    participant Worker as Analysis Worker
    participant Sources as Fontes externas
    participant LLM as LLMProvider
    participant Detector as AIDetector
    participant DB as PostgreSQL

    User->>Client: Clica em "Analisar"
    Client->>Client: Extrai ou seleciona conteúdo autorizado
    Client->>API: POST /v1/analyses
    API->>API: Auth + validação + cota + idempotência
    API->>DB: Cria análise (queued)
    API->>Redis: Enfileira analysisId
    API-->>Client: 202 Accepted + analysisId
    Redis->>Worker: Entrega job
    Worker->>DB: Estado processing
    Worker->>Worker: Normaliza + extrai alegações
    Worker->>Sources: Consulta checagens e busca evidências
    Sources-->>Worker: Resultados e URLs
    Worker->>LLM: Avalia alegações contra evidências
    LLM-->>Worker: Vereditos estruturados
    opt Detector compatível e permitido pelo orçamento
      Worker->>Detector: Envia conteúdo elegível
      Detector-->>Worker: Indícios de IA + limitações
    end
    Worker->>DB: Persiste relatório sem captura bruta
    Worker->>Redis: Invalida status/cache do job
    Client->>API: GET /v1/analyses/{id}
    API-->>Client: Status + relatório + fontes
    Client-->>User: Mostra resultados separados
```

### 4.2 Pipeline em etapas (redução de gastos)

```mermaid
flowchart TD
    S[Conteúdo submetido] --> V{Formato válido e consentido?}
    V -->|Não| E[Erro de validação]
    V -->|Sim| C{Já existe resultado reutilizável?}
    C -->|Sim| K[Retorna cache permitido]
    C -->|Não| N[Extrai e normaliza conteúdo]
    N --> P{Há alegações verificáveis?}
    P -->|Não| I[Relatório: nada verificável]
    P -->|Sim| F[Pesquisa checagens existentes]
    F --> B[Busca fontes adicionais se necessário]
    B --> Q[Confronta afirmações com evidências]
    Q --> R[Relatório factual]
    N --> D{Detecção habilitada e aplicável?}
    D -->|Sim| H[Chama API especializada]
    D -->|Não| X[Status: não disponível]
    H --> Z[Resultado probabilístico separado]
    R --> OUT[Combina seções do relatório]
    Z --> OUT
    X --> OUT
    I --> OUT
```

**Regra:** etapas opcionais caras só são executadas se houver utilidade identificada, limite disponível, consentimento pertinente e provedor configurado. Não disparar chamadas múltiplas indiscriminadamente.

### 4.3 Máquina de estados de jobs

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> processing
    queued --> cancelled
    processing --> completed
    processing --> partial
    processing --> failed
    processing --> cancelled
    failed --> queued: Retry transitório controlado
    completed --> [*]
    partial --> [*]
    cancelled --> [*]
```

- `completed`: etapas obrigatórias executadas; não significa que todas as alegações foram conclusivas.
- `partial`: resultado utilizável, com indisponibilidade de uma fonte ou módulo complementar.
- `failed`: nenhuma resposta confiável foi produzida; apresentar mensagem e possibilidade de nova tentativa.
- Retries exponenciais com *jitter* e `maxAttempts` definido; sem retry ilimitado de `4xx`, violações de cota ou bloqueio de conta.
- O `analysisId` é a chave para idempotência do processamento; cada passo tem controle de conclusão para evitar cobranças repetidas.

## 5. Estratégia de verificação factual

### 5.1 Pipeline lógico

1. **Extração de alegações:** detectar afirmações factuais específicas, separando opiniões e frases não passíveis de teste.
2. **Normalização e desambiguação:** entidades, datas, geografia, unidades e contexto do autor; não remover qualificadores como “em 2024” ou “segundo o estudo”.
3. **Recuperação de evidências:** começar por verificações preexistentes; complementar com fontes públicas adequadas ao domínio e ao período.
4. **Confiabilidade das fontes:** privilegiar documentos primários, publicações científicas, bases oficiais e checadores reconhecidos; registrar conflitos e datas de atualização. Não usar uma pontuação única arbitrária de “credibilidade” como substituta da avaliação.
5. **Síntese fundamentada:** o LLM recebe **somente** alegação, contexto e evidências identificadas; retorna formato estruturado, com IDs das evidências que sustentam cada conclusão.
6. **Validação programática:** recusar citações inventadas, IDs inexistentes, URLs não coletadas e respostas fora do schema.
7. **Apresentação:** cada alegação tem veredito, explicação, links, data da análise e ressalvas.

### 5.2 Classes de veredito

| Código | Significado | Condição mínima |
|---|---|---|
| `supported` | Apoiada pelas evidências disponíveis | Fontes adequadas e consistentes sustentam a afirmação |
| `refuted` | Contradita pelas evidências disponíveis | Fontes adequadas demonstram incompatibilidade relevante |
| `mixed` | Parcialmente correta, descontextualizada ou com evidências conflitantes | Trechos/contextos diferentes recebem avaliações distintas |
| `insufficient_evidence` | Não foi possível concluir | Evidências ausentes, insuficientes ou de qualidade inadequada |
| `not_checkable` | Fora do domínio factual | Opinião, preferência, previsão vaga ou afirmação indeterminável |

Não calcular “**93% verdadeiro**” a partir do julgamento de um LLM. Uma eventual métrica do relatório, como **3/5 alegações sustentadas**, deve informar precisamente o denominador e excluir/nomear as inconclusivas.

### 5.3 Integração com fontes

- `FactCheckProvider`: adaptador inicial para **Google Fact Check Tools API** (consulta de alegações já verificadas). Uma checagem encontrada é evidência externa, não garantia automática de veracidade.
- `SearchProvider`: adaptador para mecanismo de busca com acesso licenciado/API, a ser contratado ou habilitado na franquia disponível. Não pressupor *scraping* irrestrito de resultados de busca.
- `EvidenceFetcher`: coleta apenas páginas permitidas, em HTTPS, com limites de tamanho/tempo/redirecionamentos e checagens de SSRF.
- `EvidenceRanker`: seleciona evidências relevantes por tópico, data, procedência e independência; **diversidade de URLs não equivale a independência de fontes**.
- `EvidenceValidator`: valida se as evidências realmente contêm os trechos citados; rejeita URL fabricada.

**Proteção contra injeção de prompt:** páginas e textos externos são sempre tratados como **dados não confiáveis**, nunca como instruções para o modelo, para o código ou para as ferramentas.

## 6. Detecção de conteúdo gerado por IA

### 6.1 Separação por mídia

```text
DetectionModule
├── TextAIDetector      # Estimativa de autoria por IA em texto
├── ImageAIDetector     # Sinais de geração/manipulação sintética em imagem
└── NoopDetector        # Retorna not_available, sem inventar resultado
```

Uma única API não deve ser considerada automaticamente competente para **ambos** os formatos. Cada integração precisa explicitar `supportedMediaTypes`, idiomas, dimensão máxima, custo, qualidade e limites conhecidos.

### 6.2 Contrato conceitual

```ts
type DetectionResult = {
  status: 'completed' | 'not_available' | 'not_supported' | 'failed';
  mediaType: 'text' | 'image';
  provider?: string;
  modelVersion?: string;
  score?: number; // escala 0..1, com semântica definida pelo fornecedor
  scoreMeaning?: 'provider_confidence' | 'synthetic_likelihood';
  suspiciousRegions?: Array<{ start: number; end: number }>;
  limitations: string[];
  evaluatedAt?: string;
};
```

- Nenhuma interface deve exibir `score * 100` como “percentual do texto escrito por IA” se a métrica do fornecedor for **confiança na classificação**.
- É proibido transformar ausência de detecção em certeza de autoria humana.
- Fornecer mensagem educativa sobre falsos positivos/negativos e textos híbridos.
- Não bloquear usuários, acusar plágio ou aplicar sanção automática com base apenas nesse resultado.

### 6.3 Decisão para o piloto acadêmico

`AI_DETECTION_ENABLED=false` por padrão até existir fornecedor **compatível, testado e financiado**, com cláusulas de dados aceitáveis. O painel pode mostrar “Detector de IA indisponível nesta versão”, mantendo a **checagem factual funcional**. Se houver uma API de teste, ativá-la somente mediante auditoria de custo e tratamento de dados.

**Importante:** análise multimodal de imagem para **extrair o que aparece nela** não equivale à detecção forense de uma imagem gerada por IA.

## 7. Motor de modelos e planos futuros

### 7.1 Interfaces e configuração

```ts
interface LLMProvider {
  generateStructured<T>(request: {
    promptVersion: string;
    messages: Array<{ role: 'system' | 'user'; content: string }>;
    schema: unknown;
    maxOutputTokens: number;
    timeoutMs: number;
  }): Promise<{
    output: T;
    usage: { inputTokens: number; outputTokens: number };
    providerModelId: string;
  }>;
}

type AnalysisTier = 'mvp' | 'light' | 'medium' | 'high' | 'ultra';

interface AnalysisPolicy {
  tier: AnalysisTier;
  modelRoute: string[];
  maxClaims: number;
  maxEvidenceSearches: number;
  maxModelCalls: number;
  maxEstimatedCostUsd: number;
  enableCrossValidation: boolean;
}
```

Os nomes de planos representam **políticas de execução**, não código de negócio específico. `ModelRouter` consulta configurações versionadas, disponibilidade, orçamento e *feature flags*. A API nunca aceita livremente um ID arbitrário de modelo enviado pelo cliente.

### 7.2 Mapa de níveis planejados

| Nível | Modelos de referência (configuráveis) | Perfil de análise | Disponibilidade |
|---|---|---|---|
| **MVP** | `gemini-2.5-flash-lite` **ou** adaptador Qwen acessível | Pipeline único, limites baixos, sem cruzamento | Primeira versão |
| **Light** | `gemini-2.5-flash-lite` | Verificações rápidas e econômicas | Futuro comercial |
| **Medium** | `gpt-6-luna` | Mais contexto e buscas/revisões adicionais | Futuro comercial |
| **High** | `gemini-3.8-flash` + `gpt-6-luna` | Avaliação cruzada das **mesmas evidências**, com detecção de divergências | Futuro comercial |
| **Ultra** | `gpt-6.1-sol` | Busca ampliada, decomposição e aprofundamento controlado | Futuro comercial |

**IDs verificados em documentação oficial em 03/11/2026:** `gemini-2.5-flash-lite`, `gemini-3.8-flash`, `gpt-6-luna`, `gpt-6.1-sol`. A disponibilidade por conta/região, os limites, preços e IDs devem ser conferidos na configuração operacional. **Qwen** permanece uma alternativa de provedor a avaliar; nenhum endpoint, modelo ou franquia gratuita foi assumido sem homologação.

### 7.3 Estratégia de cruzamento no High

```mermaid
flowchart TB
    E[Mesmo conjunto de alegações e evidências] --> L[Gemini 3.8 Flash]
    E --> G[GPT-6 Luna]
    L --> J[Comparador estruturado]
    G --> J
    J --> D{Concordam sobre evidências e veredito?}
    D -->|Sim| S[Sintetizar conclusão com fontes]
    D -->|Não| R[Marcar divergência e revisar evidências]
    R --> O[Possível resultado inconclusivo]
```

Modelos diferentes **não são fontes independentes**. Concordância entre modelos não prova veracidade. O sistema limita chamadas extras e prioriza explicitar divergências em vez de fabricar consenso.

### 7.4 Política de roteamento e falhas

- Roteamento por `tier` e `task` (`claim_extraction`, `evidence_assessment`, `report_synthesis`), com adaptação independente por tarefa.
- *Timeout*, *circuit breaker* e limite de tokens por operação.
- Falhas ou *rate limits* retornam `partial` ou erro rastreável; nenhum *fallback* não autorizado para modelo mais caro.
- Prompts possuem versão, testes e validação de JSON Schema/Zod.
- A contabilidade de tokens/custos é registrada por **execução efetiva**, não somente estimada.
- Mudanças de modelo exigem testes regressivos antes de publicação.

## 8. Captura de conteúdo por plataforma

### 8.1 Web — Next.js

- Entrada por texto colado, URL e upload de imagem.
- Visualização prévia da informação que será enviada ao servidor, sobretudo imagens.
- Histórico autenticado, detalhe de relatório, fontes e exclusão de registros.
- Em URLs, o backend **não executa scripts da página**; busca e extrai texto de forma controlada.
- Para imagens enviadas pela Web, usar OCR no worker (`Tesseract`/adaptador equivalente) ou processamento multimodal permitido, sem confundir reconhecimento visual com detector de IA.

### 8.2 Extensão Chrome — Manifest V3

**Fluxo:** usuário clica no ícone ou no botão **“Analisar esta página”** → `activeTab` concede acesso temporário à aba → script extrai conteúdo relevante do DOM → usuário confirma a prévia → extensão chama a API → resultado é exibido em popup/painel lateral.

- Preferir `chrome.scripting.executeScript` com permissões `activeTab` e `scripting`.
- Usar heurísticas de extração de artigo, respeitando comprimento máximo e evitando campos sensíveis (`input`, `textarea`, `contenteditable`, formulários e áreas marcadas como privadas).
- `chrome.sidePanel` é opcional para exibição de resultados; não é mecanismo de leitura contínua.
- Páginas restritas (`chrome://`, Chrome Web Store, algumas páginas internas, etc.) podem ser incompatíveis.
- Não solicitar `<all_urls>` como permissão permanente no MVP apenas por conveniência.
- `chrome.tabs.captureVisibleTab` somente se a futura função de imagem for explicitamente acionada e consentida; não é parte do fluxo textual padrão.
- **Nunca** anexar chaves de provedores LLM ao código da extensão.

### 8.3 Android — Flutter + Kotlin

**Fluxo:** botão **“Analisar tela”** → diálogo de consentimento do Android → `MediaProjection` captura uma sessão autorizada → extração de texto **local** com ML Kit OCR → prévia/editável pelo usuário → envio **apenas do texto selecionado** à API, como padrão → relatório.

- Integrar APIs nativas com `MethodChannel`/`EventChannel` ou plugin Flutter próprio.
- Consentimento solicitado **a cada sessão** de projeção conforme requisitos aplicáveis; *token* de captura de uso único.
- Declarar o tipo de *foreground service* `mediaProjection` e suas permissões quando exigido pela versão alvo.
- Encerrar projeção imediatamente após a captura; tratar `onStop`, cancelamento e telas protegidas.
- Uma interface de compartilhamento (`ACTION_SEND`/`ACTION_PROCESS_TEXT` quando aplicável) pode servir como alternativa menos intrusiva à captura.
- Imagens brutas permanecem em memória/armazenamento temporário do dispositivo e são removidas após OCR; enviar imagem integral só em fluxo específico, consentido.
- Não prometer captura de qualquer aplicativo ou execução invisível em segundo plano.

## 9. Persistência e modelo de dados

### 9.1 Diagrama entidade-relacionamento

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : owns
    USERS ||--o{ ANALYSES : requests
    ANALYSES ||--o{ CLAIMS : contains
    CLAIMS ||--o{ CLAIM_EVIDENCE : linked_to
    EVIDENCE ||--o{ CLAIM_EVIDENCE : supports
    ANALYSES ||--o{ DETECTION_RESULTS : has
    ANALYSES ||--o{ MODEL_INVOCATIONS : triggers
    USERS ||--o{ USAGE_EVENTS : consumes
    ANALYSES ||--o{ USAGE_EVENTS : accounts_for

    USERS {
      uuid id PK
      string email UK
      string password_hash
      string role
      datetime created_at
      datetime deleted_at
    }
    SESSIONS {
      uuid id PK
      uuid user_id FK
      string refresh_token_hash
      datetime expires_at
      datetime revoked_at
    }
    ANALYSES {
      uuid id PK
      uuid user_id FK
      string input_type
      string content_fingerprint
      string status
      string tier
      string consent_version
      datetime created_at
      datetime completed_at
    }
    CLAIMS {
      uuid id PK
      uuid analysis_id FK
      string statement
      string verdict
      string explanation
    }
    EVIDENCE {
      uuid id PK
      string canonical_url
      string publisher
      string title
      datetime published_at
      datetime retrieved_at
    }
    CLAIM_EVIDENCE {
      uuid claim_id FK
      uuid evidence_id FK
      string relation
      string cited_excerpt
    }
    DETECTION_RESULTS {
      uuid id PK
      uuid analysis_id FK
      string media_type
      string status
      string provider
      float score
      string score_meaning
    }
    MODEL_INVOCATIONS {
      uuid id PK
      uuid analysis_id FK
      string provider_model_id
      int input_tokens
      int output_tokens
      decimal cost_usd
      string prompt_version
    }
    USAGE_EVENTS {
      uuid id PK
      uuid user_id FK
      uuid analysis_id FK
      string operation
      decimal cost_usd
      datetime created_at
    }
```

### 9.2 Diretrizes de modelagem

- UUIDs nas entidades públicas; políticas de isolamento: cada usuário acessa **somente suas próprias análises**.
- `EVIDENCE` pode ser reutilizada por diversos relatórios, mas o vínculo preserva a forma como foi usada em cada alegação.
- Conteúdo privado original **não** é mantido indefinidamente para facilitar caching.
- `content_fingerprint`: hash HMAC com segredo de servidor, usado para deduplicação apropriada. Não expor hash de conteúdo sensível em URLs ou logs.
- `MODEL_INVOCATIONS`: armazenar metadados de custo/modelo, **não prompts completos contendo dados privados**, salvo consentimento explícito e finalidade documentada.
- Índices mínimos: `analyses(user_id, created_at)`, `analyses(status, created_at)`, `claims(analysis_id)`, `usage_events(user_id, created_at)`, `evidence(canonical_url)`.
- Exclusões aplicadas com política documentada para dados pessoais, auditoria mínima e retenção legal.

### 9.3 Retenção proposta (parâmetros configuráveis)

| Categoria | Retenção inicial sugerida | Observação |
|---|---|---|
| Capturas brutas de Android | Não persistir no backend por padrão | Processamento local sempre que possível |
| Upload temporário de imagem | Apagar ao concluir; limite de segurança **15 min** | Limpeza por job + rotina de expiração |
| Texto bruto de análise | Somente durante execução; não persistir por padrão | Relatório guarda apenas trechos necessários e consentidos |
| Relatório e fontes | Até exclusão do usuário ou prazo de retenção divulgado | Ajustável nas preferências/política |
| Logs de API | Curta retenção operacional definida por política | Sem imagens, textos privados e tokens |
| Eventos de custo/segurança | Prazo de auditoria documentado | Metadados mínimos |

**Antes de disponibilizar ao público:** formalizar a Política de Privacidade, o fundamento legal aplicável sob a LGPD, os fornecedores/suboperadores, direitos dos titulares e transferências internacionais pertinentes.

## 10. API HTTP e contratos

Base: `/v1`. JSON/UTF-8, TLS obrigatório em produção, OpenAPI, validação de entrada via DTO/Zod/class-validator, identificadores de correlação.

| Método | Rota | Função |
|---|---|---|
| `POST` | `/v1/auth/register` | Cadastro |
| `POST` | `/v1/auth/login` | Autenticação |
| `POST` | `/v1/auth/refresh` | Rotação de sessão |
| `POST` | `/v1/auth/logout` | Revogação |
| `GET` | `/v1/me` | Perfil e cotas |
| `POST` | `/v1/uploads` | Upload temporário validado de imagem |
| `POST` | `/v1/analyses` | Criar análise (retorna `202`) |
| `GET` | `/v1/analyses/{id}` | Obter status e resultado |
| `GET` | `/v1/analyses` | Histórico paginado |
| `POST` | `/v1/analyses/{id}/cancel` | Cancelar quando possível |
| `DELETE` | `/v1/analyses/{id}` | Excluir relatório e vínculos pessoais |
| `GET` | `/v1/usage` | Utilização e cota |
| `GET` | `/health/live` | Liveness sem detalhes sensíveis |
| `GET` | `/health/ready` | Readiness (acesso restrito, quando aplicável) |

### 10.1 Exemplo de criação

```http
POST /v1/analyses
Authorization: Bearer <access_token>
Idempotency-Key: 0b4b90ee-... 
Content-Type: application/json
```

```json
{
  "inputType": "text",
  "text": "Texto submetido voluntariamente para verificação.",
  "tier": "mvp",
  "requestedChecks": ["fact_check", "ai_detection"],
  "sourceContext": { "origin": "chrome", "url": "https://exemplo.org/artigo" }
}
```

```json
{
  "id": "e60292ce-cd52-4782-a195-8d43c44b9515",
  "status": "queued",
  "tierApplied": "mvp",
  "statusUrl": "/v1/analyses/e60292ce-cd52-4782-a195-8d43c44b9515"
}
```

### 10.2 Contrato resumido do relatório

```json
{
  "status": "completed",
  "factual": {
    "summary": "Resultado fundamentado nas fontes consultadas.",
    "claims": [
      {
        "statement": "Alegação analisada",
        "verdict": "insufficient_evidence",
        "explanation": "As fontes disponíveis não permitem conclusão.",
        "evidenceIds": ["ev-1"]
      }
    ]
  },
  "aiDetection": {
    "status": "not_available",
    "mediaType": "text",
    "limitations": ["Detector especializado não configurado no MVP."]
  },
  "sources": [
    {
      "id": "ev-1",
      "url": "https://exemplo.org/fonte",
      "retrievedAt": "2026-11-03T15:00:00Z"
    }
  ],
  "methodologyVersion": "1.0"
}
```

**Respostas de erro** padronizadas: `400` validação, `401` não autenticado, `403` sem autorização, `404` recurso inexistente/inacessível, `409` idempotência incompatível, `413` upload excessivo, `422` conteúdo não analisável, `429` cota/rate limit e `503` fornecedor temporariamente indisponível. APIs externas não têm seus erros brutos expostos ao usuário.

## 11. Segurança, privacidade e prevenção de abusos

### 11.1 Identidade e sessões

- Senhas com **Argon2id** e políticas contra credenciais fracas; fluxo de recuperação com token temporário e uso único.
- Access tokens de curta duração, **refresh tokens rotativos e revogáveis**, armazenados como hash no banco; limitar sessões ativas.
- Web: preferir **cookies `HttpOnly`, `Secure`, `SameSite`**, com proteção CSRF quando aplicável. Chrome e Android usam fluxo de autenticação apropriado ao cliente e armazenamento seguro de credenciais; não utilizar `localStorage` para token sensível na Web.
- Extensão: usar armazenamento de sessão quando possível e conceder escopos mínimos; não incluir segredos de API de IA no cliente.
- Android: usar *secure storage* respaldado por mecanismos nativos; limpar sessão no logout.
- Autorização por propriedade de recurso no serviço/repositório; nunca confiar em `userId` do request body.

### 11.2 Controle de upload, URL e conteúdo

- Limites de bytes, comprimento de texto, número de claims, dimensões de imagem, MIME detectado por assinatura, timeout e consumo de memória.
- Evitar execução de scripts/macros em conteúdo remoto; nunca instalar ou executar arquivos recebidos.
- **SSRF:** bloquear redes privadas/loopback/link-local, metadados de nuvem e URLs não HTTP(S); validar DNS e cada redirecionamento, limitar redirects e tamanho de resposta.
- Sanitizar HTML e renderizar texto externo sem execução; cabeçalhos CSP, CORS por origem permitida, cookies seguros e proteção contra XSS.
- Bloquear captura de campos secretos; permitir revisão pré-envio e oferecer descarte de trechos sensíveis.
- Chaves de provedores exclusivamente em variáveis/secret manager no servidor.
- *Rate limiting* em IP/usuário, limite de concorrência por plano, CAPTCHA ou verificações equivalentes quando necessário; proteção contra uso automatizado abusivo.
- Proibir instruções vindas de páginas externas de alterar sistema, fontes, política de custo ou formato de saída.

### 11.3 Política de uso de provedores gratuitos

A página de preços oficial do Gemini informa que, no **free tier**, conteúdos podem ser **usados para melhorar os produtos do fornecedor**. Por isso:

1. **Piloto acadêmico:** usar dados sintéticos, notícias públicas ou conteúdo cuja transmissão seja autorizada e entendida.
2. **MVP público:** **não habilitar por padrão o envio de capturas privadas para esse free tier**. Obter revisão de privacidade/contratos e escolher uma forma de processamento compatível antes do lançamento.
3. Informar **qual provedor** recebe o conteúdo, para qual finalidade e em quais condições.
4. Não divulgar “privacidade total”, “zero retenção” ou garantias não previstas contratualmente.

### 11.4 Ameaças prioritárias

| Ameaça | Mitigação |
|---|---|
| Abuso de créditos/requisições | BudgetGuard, quotas, rate limit, cache e circuit breaker |
| Vazamento de tela ou dados pessoais | OCR local, prévia/consentimento, retenção mínima |
| Prompt injection em páginas | Isolamento entre instruções e dados; validação do resultado |
| Citações forjadas | Evidência persistida + checagem de IDs/URLs e trechos |
| SSRF por links | Validação de DNS, IPs, redirects e downloads |
| Acesso indevido a histórico de terceiros | Autorização por `userId` em cada consulta |
| Resultado de IA falso positivo | Linguagem probabilística e indicadores de limitações |
| Falha de fornecedor | Timeout, retry finito, resultado parcial, circuit breaker |
| Cobrança duplicada | Idempotência, transações e registro por invocação |

## 12. Cache, filas e controle de custos

### 12.1 Redis

- **BullMQ:** fila `analysis-jobs`, prioridades e concorrência configuráveis; criação do registro em PostgreSQL antes de enfileirar e mecanismo de reconciliação para jobs perdidos.
- **Cache de evidências públicas:** chave por alegação normalizada, versão do algoritmo, idioma e janela temporal. TTL inicial indicativo: 6–24 h, menor em notícias em desenvolvimento.
- **Cache de resultado privado:** por usuário e fingerprint HMAC, com expiração curta; nunca servir análise privada de um usuário a outro.
- **Deduplicação de requisições simultâneas:** uma única execução por chave idempotente válida, sempre respeitando permissões do proprietário.
- **Rate limit:** janelas por usuário/IP e orçamento compartilhado.

### 12.2 Política de execução econômica

```text
1. Validar e limitar entrada (grátis, local)
2. Conferir idempotência e cache autorizado
3. Extrair o mínimo necessário
4. Identificar 1..N alegações principais
5. Consultar checagens já publicadas
6. Buscar evidências adicionais somente quando faltarem
7. Fazer 1 chamada estruturada ao LLM quando viável
8. Validar JSON e links sem chamar outro LLM
9. Executar detector apenas se permitido, disponível e dentro do orçamento
10. Salvar relatório/contabilizar gasto e limpar temporários
```

### 12.3 Orçamento e limites

Controles configuráveis por ambiente/plano:

- `MAX_TEXT_CHARS`, `MAX_IMAGE_BYTES`, `MAX_CLAIMS_PER_ANALYSIS`.
- `MAX_SEARCH_CALLS_PER_ANALYSIS`, `MAX_LLM_CALLS_PER_ANALYSIS`.
- `MAX_ANALYSES_PER_USER_PER_DAY`, `MAX_CONCURRENT_JOBS`.
- `MAX_USD_PER_ANALYSIS`, `MAX_USD_PER_DAY_GLOBAL`.
- `DETECTION_ENABLED`, `ALLOWED_TIERS`, `MODEL_ROUTING_CONFIG`.
- Ativar *hard stop* de execução quando o limite for atingido; o sistema pode devolver relatório parcial.

### 12.4 Modelo de cálculo financeiro

\[
C_{analise} = C_{tokens} + C_{pesquisa} + C_{detector} + C_{OCR} + C_{infra}
\]

\[
C_{tokens} = (T_{in}/10^6 \times P_{in}) + (T_{out}/10^6 \times P_{out})
\]

**Exemplo puramente ilustrativo:** preço pago listado em 03/11/2026 para `gemini-2.5-flash-lite`: **US$ 0,10 / milhão de tokens de entrada** e **US$ 0,40 / milhão de tokens de saída**. Uma análise com **3.000 tokens de entrada** e **500 de saída** custaria em tokens **US$ 0,0005** (antes de busca, detector, OCR, infraestrutura, câmbio, tributos e outros usos). Em **10.000 análises** idênticas, somente a parcela simulada de tokens seria **US$ 5**. Isso **não** é orçamento completo nem previsão garantida; uma análise pode fazer várias chamadas e provedores de busca/detecção podem dominar o custo.

Na franquia gratuita, custo monetário da inferência pode ser zero até os limites aplicáveis, mas permanecem restrições de **RPM/TPM/RPD**, disponibilidade, uso de dados e demais custos do produto. Verificar valores e termos antes de cada fase de implantação.

### 12.5 Modelo futuro de precificação

| Parâmetro | Light | Medium | High | Ultra |
|---|---|---|---|---|
| Profundidade de pesquisa | Baixa | Média | Alta | Muito alta |
| Busca externa | Limitada | Ampliada | Ampliada + conferência | Pesquisa aprofundada |
| Modelos usados | 1 econômico | 1 intermediário | 2 com confronto | 1 avançado + etapas adicionais |
| Cota de custo por análise | Menor | Intermediária | Alta | Mais alta |
| Preço ao cliente | A definir por medição | A definir por medição | A definir por medição | A definir por medição |

Preço comercial futuro = custo variável esperado + parcela de infraestrutura/suporte + margem + reserva de risco/impostos, com teste real de distribuição de consumo. **Não** divulgar preços sem benchmark e análise jurídica/comercial.

## 13. Docker, implantação e operação

### 13.1 Compose local

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: autenticai
      POSTGRES_USER: autenticai
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U autenticai -d autenticai"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis_data:/data

  api:
    build:
      context: ..
      dockerfile: infra/docker/api.Dockerfile
    env_file: ../.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    ports:
      - "127.0.0.1:3001:3001"

  worker:
    build:
      context: ..
      dockerfile: infra/docker/worker.Dockerfile
    env_file: ../.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  web:
    build:
      context: ..
      dockerfile: infra/docker/web.Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

Este Compose é **um esqueleto de referência**, não um projeto pronto para execução: os Dockerfiles, scripts de build e variáveis reais ainda precisam ser implementados. O caminho do volume PostgreSQL deve ser ajustado conforme a versão/imagem adotada. Em produção, PostgreSQL/Redis não devem ser expostos publicamente; TLS será terminado em proxy/ingress apropriado, e os serviços receberão credenciais individuais com privilégios mínimos.

### 13.2 Variáveis principais

```dotenv
NODE_ENV=development
API_PORT=3001
DATABASE_URL=postgresql://autenticai:CHANGE_ME@postgres:5432/autenticai
REDIS_URL=redis://redis:6379
JWT_ACCESS_SECRET=CHANGE_ME_STRONG_RANDOM
JWT_REFRESH_SECRET=CHANGE_ME_STRONG_RANDOM
POSTGRES_PASSWORD=CHANGE_ME
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-flash-lite
GEMINI_API_KEY=CHANGE_ME
AI_DETECTION_ENABLED=false
MAX_ANALYSES_PER_USER_PER_DAY=5
MAX_LLM_CALLS_PER_ANALYSIS=2
MAX_USD_PER_ANALYSIS=0.02
UPLOAD_RETENTION_MINUTES=15
```

`CHANGE_ME` é **placeholder**, nunca segredo real. Segredos não entram no Git; `.env` é ignorado. Em produção, usar secret manager, rotação e segregação por ambiente.

### 13.3 Topologia de publicação sugerida

```mermaid
flowchart LR
    Internet[Usuários] --> Edge[CDN / WAF / TLS]
    Edge --> WEB[Next.js]
    Edge --> API[NestJS API]
    API --> PG[(PostgreSQL privado)]
    API --> REDIS[(Redis privado)]
    REDIS --> WK[Worker]
    WK --> PG
    WK --> THIRD[Provedores externos]
```

Na primeira demonstração, a publicação pode ser simplificada. **Para abertura pública**, exigir backups restauráveis, separação de segredos, HTTPS, cota global, monitoramento, política de privacidade e procedimento de incidentes. Não assumir que serviços gratuitos incluem SLA, alta disponibilidade ou quotas ilimitadas.

### 13.4 CI/CD e qualidade

1. **Pull request:** lint, formatação, TypeScript strict, testes unitários, build e análise de dependências.
2. **Integração:** subir PostgreSQL e Redis via contêiner e executar testes de módulos/API.
3. **Contrato:** validar `openapi.yaml`; gerar cliente TS e Dart quando necessário.
4. **Segurança:** *dependency scanning*, verificação de segredos e testes de SSRF/autorização.
5. **Build:** imagens Docker versionadas, sem rodar como root quando possível.
6. **Deploy:** migrations controladas, *health checks*, backup e rollback; não executar migrações incompatíveis sem plano.

### 13.5 Logs e métricas

- Logs JSON com `requestId`, `analysisId`, `userId` pseudonimizado, status, etapa, duração e erro **sanitizado**.
- Métricas: `analyses_total`, `analysis_duration_seconds`, `provider_requests_total`, `tokens_used_total`, `cost_usd_total`, `cache_hit_ratio`, `queue_depth`, `error_rate`, `inconclusive_ratio` e falhas de validação de citações.
- Alertas quando orçamento diário, filas, falha de fornecedor ou tempo de resposta ultrapassarem thresholds configurados.
- Não registrar textos enviados, prints ou chaves em observabilidade.

## 14. Testes e critérios de aceitação

### 14.1 Testes necessários

| Categoria | Casos mínimos |
|---|---|
| Unidade | Normalização, critérios de classificação, BudgetGuard, controle de tier |
| Contrato | JSON estruturado dos modelos, erros de providers, rotas OpenAPI |
| Integração | Job completo com PostgreSQL/Redis e provedores *mockados* |
| Segurança | IDOR/BOLA, SSRF, upload inválido, XSS, injection e rate limits |
| Chrome | Permissão temporária, página restrita, conteúdo excessivo, campos privados |
| Android | Consentimento negado, captura encerrada, tela protegida, OCR com erros |
| Qualidade factual | Alegações suportadas, refutadas, mistas e inconclusivas em dataset curado |
| Qualidade de detector | Avaliação de falsos positivos/negativos em português, se módulo habilitado |
| Custos | Cota atingida, retries, deduplicação e ausência de chamadas extras |
| Exclusão | Apagar dados de análise e artefatos temporários conforme política |

### 14.2 Critérios de aceite do MVP

- [ ] Um usuário autenticado realiza análise por texto, URL e imagem na Web.
- [ ] A extensão Chrome só extrai conteúdo após clique e mostra prévia/resultado.
- [ ] Android solicita consentimento, captura sob demanda e usa OCR local.
- [ ] Todo veredito factual contém evidência recuperável **ou** status inconclusivo.
- [ ] Relatório separa autoria por IA de veracidade; detector inativo não inventa percentual.
- [ ] API impede consulta de análises de outros usuários.
- [ ] Limits/quotas e orçamento impedem gasto acima dos parâmetros definidos.
- [ ] Capturas temporárias são eliminadas e não aparecem em logs.
- [ ] Aplicação inicia de modo reproduzível com Docker para API, worker e serviços.
- [ ] Um roteiro de teste com fontes conhecidas documenta acertos, erros e limitações.

## 15. Roadmap de implementação

| Fase | Entregas | Condição para avançar |
|---|---|---|
| **0 — Fundação** | Monorepo, Compose, banco, autenticação, OpenAPI, CI básico | Ambiente sobe e testes passam |
| **1 — Núcleo factual** | Recepção de texto, claims, fontes, Gemini/Qwen por adaptador, relatório | Citações reais, respostas inconclusivas corretas |
| **2 — Multiformato Web** | URL segura, imagem, OCR, histórico, controles de privacidade | Testes de SSRF e descarte de arquivos |
| **3 — Extensão Chrome** | MV3, `activeTab`, botão, prévia, painel de resultados | Nenhuma extração sem gesto do usuário |
| **4 — Android** | Flutter, MediaProjection, ML Kit local, histórico | Sessão autorizada/encerrada corretamente |
| **5 — Piloto controlado** | Quotas, métricas, políticas, benchmark com usuários convidados | Custos e privacidade validados |
| **6 — Preparação comercial** | Detector especializado avaliado, tiers, roteamento mult-modelo, billing | Orçamento, termos, segurança e resultados medidos |

O **MVP acadêmico** é concluído com as fases 0–4 em ambiente controlado. O **piloto público** exige também a fase 5. A fase 6 **não** deve bloquear a entrega acadêmica.

## 16. Registros de decisões arquiteturais (ADRs)

| ID | Decisão | Motivo | Trade-off |
|---|---|---|---|
| ADR-001 | Monólito modular NestJS | Menor custo operacional, mais simples para equipe pequena | Exige disciplina na separação de módulos |
| ADR-002 | PostgreSQL + Prisma | Integridade, vínculos de evidência e migrations | Menos flexibilidade que schema livre |
| ADR-003 | Redis + BullMQ | Processamento demorado desacoplado do HTTP | Mais um serviço operacional |
| ADR-004 | REST + OpenAPI | Integração interoperável entre Web/Chrome/Flutter | Polling inicial produz tráfego de estado |
| ADR-005 | Ports/adapters para IA | Evolução de tiers e fornecedores sem reescrever domínio | Abstração e testes de contrato adicionais |
| ADR-006 | Análise somente sob demanda | Privacidade, autonomia do usuário e custos controlados | Menos cobertura do que monitoramento contínuo |
| ADR-007 | Retenção mínima de capturas | Redução da exposição de dados sensíveis | Menos capacidade de reproduzir análises antigas |
| ADR-008 | Detecção como módulo opcional | Não forjar resultados e não depender de serviço pago no MVP | Funcionalidade pode estar indisponível no piloto |
| ADR-009 | Resultados factuais por alegação | Evita simplificação e comunica incerteza | UI e pipeline mais elaborados |

## 17. Pendências de engenharia (não impedem a definição arquitetural)

1. Escolher e homologar o **provedor de busca**, incluindo custo, limites, licenciamento e frescor dos resultados.
2. Selecionar o **provedor de detecção de IA** para texto/imagem e aferir desempenho real em português brasileiro — ou manter desabilitado.
3. Definir orçamento mensal real, quantidade esperada de usuários e política de cotas do piloto.
4. Escolher hospedagem e avaliar acordos sobre dados processados pelos provedores.
5. Definir entidade responsável pelo tratamento dos dados, contatos de privacidade e termos de uso.
6. Ajustar mecanismo de autenticação para login Web, extensão e aplicativo Android com fluxo seguro entre plataformas.
7. Criar conjunto de testes em português (fatos verdadeiros, falsos, mistos, ambíguos e notícias recentes).
8. Definir critérios de versionamento das evidências para reanalisar conteúdos cuja veracidade muda com o tempo.

## 18. Referências técnicas e documentação oficial

Consulta de referência: **03/11/2026**. A documentação e preços dos fornecedores podem mudar.

1. Google Gemini API — [Preços, tier gratuito e uso de dados](https://ai.google.dev/gemini-api/docs/pricing).
2. Google Gemini API — [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).
3. Google AI Studio — [Gemini 3.8 Flash e ID oficial](https://aistudio.google.com/docs/models/gemini-3.8-flash).
4. OpenAI API — [Modelos GPT-6 e IDs oficiais](https://developers.openai.com/api/docs/models).
5. Google — [Fact Check Tools API](https://developers.google.com/fact-check/tools/api/reference/rest/).
6. Chrome — [Scripting API / permissões](https://developer.chrome.com/docs/extensions/reference/api/scripting).
7. Chrome — [Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel).
8. Chrome Web Store — [Políticas de privacidade e permissões](https://developer.chrome.com/docs/webstore/program-policies/policies).
9. Android — [MediaProjection e consentimento por sessão](https://developer.android.com/media/grow/media-projection).
10. Google — [ML Kit Text Recognition no Android](https://developers.google.com/ml-kit/vision/text-recognition/v2/android).
11. OWASP — [API Security Top 10](https://api-security.owasp.org/).
12. Brasil — [Lei Geral de Proteção de Dados Pessoais — Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm).

---

### Síntese da decisão arquitetural

> **AutenticAI = três clientes sob demanda + uma API NestJS modular + worker assíncrono + PostgreSQL/Redis + verificação factual baseada em evidências + detector de IA opcional e explicitamente separado + roteador de modelos versionável.**
>
> O **objetivo do MVP** é provar utilidade, transparência e viabilidade operacional; **não** é prometer infalibilidade nem ativar todos os níveis de IA antes de haver evidências de qualidade e orçamento.
