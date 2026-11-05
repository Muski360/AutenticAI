# Documentação de Requisitos e Prototipagem Inicial — AutenticAI

## Objetivo

Definir o fluxo de uso e a estrutura das principais telas para orientar o desenvolvimento frontend. Os wireframes são esboços de baixa fidelidade: representam conteúdo, hierarquia e ações, sem definir o acabamento visual. Aplicar os estilos da [Identidade Visual](IDENTIDADE_VISUAL.md) na implementação.

O sistema está em planejamento. Os exemplos abaixo são ilustrativos e não representam análises realizadas.

## Fluxo do sistema

```mermaid
flowchart TD
    A["Entrar ou criar conta"] --> B{"Selecionar plataforma"}
    B -->|Web| C["Inserir texto, link ou imagem"]
    B -->|Chrome| D["Solicitar análise da página ativa"]
    B -->|Android| E["Autorizar captura e extrair texto localmente"]
    C --> F["Revisar prévia"]
    D --> F
    E --> F
    F --> G{"Confirmar envio?"}
    G -->|Não| B
    G -->|Sim| H{"Entrada, acesso e cota válidos?"}
    H -->|Não| I["Exibir motivo e permitir correção quando aplicável"]
    I --> B
    H -->|Sim| J["Acompanhar processamento"]
    J --> K{"Resultado disponível?"}
    K -->|Completo ou parcial| L["Consultar afirmações, justificativas e fontes"]
    K -->|Falha ou cancelamento| M["Exibir estado e orientar próxima ação"]
    L --> N["Consultar histórico"]
    M --> N
    N -->|Abrir análise| J
    N -->|Nova análise| B
```

### Processamento da solicitação

```mermaid
sequenceDiagram
    actor U as Usuário
    participant F as Frontend
    participant A as API
    participant Q as Fila
    participant W as Worker
    participant S as Fontes externas
    participant D as Detector de IA
    U->>F: Confirma o envio da prévia
    F->>A: Solicita análise
    A->>A: Valida entrada, autenticação e cota
    alt Solicitação inválida ou não autorizada
        A-->>F: Retorna erro e motivo
        F-->>U: Exibe orientação
    else Solicitação aceita
        A->>A: Registra análise
        A->>Q: Enfileira solicitação
        A-->>F: Retorna identificador e estado na fila
        Q->>W: Entrega solicitação
        W->>W: Extrai afirmações verificáveis
        W->>S: Consulta evidências
        S-->>W: Retorna fontes e evidências disponíveis
        W->>W: Avalia afirmações com base nas evidências
        opt Detector compatível, habilitado e dentro do orçamento
            W->>D: Solicita análise de indícios de IA
            D-->>W: Retorna estimativa e limitações
        end
        W->>W: Persiste relatório e estado final
        loop Até receber resultado ou estado final de falha ou cancelamento
            F->>A: Consulta estado pelo identificador
            A-->>F: Retorna estado e relatório disponível
        end
        F-->>U: Exibe resultado ou orientação de falha
    end
```

O cliente consulta o estado periodicamente enquanto a análise está em andamento. A análise de indícios de IA é independente da verificação factual. O diagrama representa o processamento esperado; falhas devem seguir os estados e tratamentos definidos neste documento.

| Plataforma | Entrada e autorização | Continuação do fluxo |
|---|---|---|
| Web | Texto digitado, link HTTP(S) ou imagem selecionada pelo usuário | Prévia, confirmação e envio à API |
| Chrome | Clique em “Analisar página” para extrair texto da aba ativa compatível | Prévia e confirmação antes do envio |
| Android | Toque em “Analisar tela”, consentimento do sistema e captura pontual | OCR local, revisão do texto extraído e envio somente do texto selecionado por padrão |

Na web, a prévia de um link apresenta a URL informada; a extração do conteúdo remoto ocorre no servidor após a confirmação. No Android, encerrar a captura após obter o conteúdo necessário. Nenhuma plataforma deve realizar monitoramento contínuo.

## Requisitos associados às telas

| ID | Requisito | Tela |
|---|---|---|
| RF01 | Criar conta, entrar, recuperar acesso e encerrar sessão | Acesso e navegação |
| RF02 | Selecionar texto, link ou imagem para análise | Nova análise |
| RF03 | Revisar conteúdo e autorizar envio, incluindo página e tela | Prévia |
| RF04 | Acompanhar o estado da solicitação | Processamento |
| RF05 | Consultar classificação, justificativa e fontes por afirmação; separar indícios de IA | Resultado |
| RF06 | Consultar análises anteriores e excluir registros próprios | Histórico |

## Estados e tratamento de falhas

| Situação | Comportamento da interface |
|---|---|
| `queued` / `processing` | Exibir “Na fila” / “Processando” e permitir acompanhar pelo histórico |
| `completed` / `partial` | Exibir relatório completo / parcial, identificando limitações |
| `failed` / `cancelled` | Informar falha / cancelamento; oferecer nova análise quando aplicável |
| Conteúdo sem afirmações verificáveis | Explicar a ausência de afirmações; não forçar uma classificação factual |
| Permissão negada ou página/tela protegida | Explicar a restrição e permitir retornar sem enviar conteúdo |
| Limite de uso atingido | Informar o bloqueio e a disponibilidade de nova tentativa, se conhecida |
| Falha de conexão | Preservar a entrada na tela; se já houver solicitação, consultar seu estado antes de reenviar |
