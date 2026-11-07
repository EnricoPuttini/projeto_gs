# Arquitetura

```mermaid
flowchart LR
  subgraph Front["Frontend (Render Static Site) - M2+"]
    C["/cidadao"]; U["/ubs"]; D["/demo"]
  end
  subgraph Back["Backend Spring Boot"]
    CT["controller + @RestControllerAdvice (ProblemDetail)"]
    BO["bo: regra de negocio"]
    DAO["dao: JdbcTemplate + SQL explicito"]
    JOB["job (M2+)"]
    CLK["Clock injetado"]
  end
  DB[("Oracle")]
  C & U & D -->|REST /api/v1| CT --> BO --> DAO --> DB
  JOB --> BO
  BO -.usa.-> CLK
```

## Camadas
- **controller**: recebe, valida (Bean Validation nos DTOs) e delega. Sem regra de negócio.
- **bo**: toda a regra. Mudanças de status passam por `transicionar(...)`, que consulta a máquina de estados do enum (`StatusTransicionavel`) e lança `RegraNegocioException` (HTTP 422) se inválida.
- **dao**: SQL explícito com `NamedParameterJdbcTemplate`; `FOR UPDATE` em `ZL_VAGA`/`ZL_CONSULTA` para serializar concorrência.
- **model**: `record`s imutáveis + enums de status.

## Máquinas de estado
```mermaid
stateDiagram-v2
  [*] --> AGENDADA
  AGENDADA --> AGUARDANDO_CONFIRMACAO
  AGENDADA --> CANCELADA
  AGUARDANDO_CONFIRMACAO --> CONFIRMADA
  AGUARDANDO_CONFIRMACAO --> CANCELADA
  AGUARDANDO_CONFIRMACAO --> NAO_RESPONDIDA
  CONFIRMADA --> REALIZADA
  CONFIRMADA --> FALTA
  CONFIRMADA --> CANCELADA
  NAO_RESPONDIDA --> REALIZADA
  NAO_RESPONDIDA --> FALTA
```
CANCELADA e NAO_RESPONDIDA abrem uma `Vaga` na mesma transação.
