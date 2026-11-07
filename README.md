# Zelo

> Assistente do cidadão, por voz e texto, que **recupera consultas que seriam perdidas por falta na UBS** e **avisa o morador antes de a rua dele alagar**.
> Global Solution FIAP 2026.2 · tema CitizenTech · Engenharia de Software.

## Ficha da CitizenTech

| Campo | Preenchimento |
|---|---|
| Equipe | _(preencher: nomes e RMs — ver `TODO-EQUIPE.md`)_ |
| Problema | Consultas ficam vazias por falta enquanto outras pessoas esperam meses na fila; quem mora em área de risco só descobre o alagamento quando a água já está na porta. |
| Persona | Dona Cida, 64 anos, lê com dificuldade, usa WhatsApp e manda áudio. |
| Solução | Chat por voz/texto: oferece a vaga liberada ao próximo da fila em minutos e alerta sobre chuva forte com o abrigo mais próximo. |
| Impacto medido | Vagas recuperadas · dias de espera economizados · taxa de comparecimento · moradores alertados antes do alagamento. |
| Dados | 100% simulados (nenhum dado pessoal real). |

> Status: **M1 concluído** (base do backend, banco e CRUD). Veja `docs/` e `TODO-EQUIPE.md`.

## Como rodar local (M1)

Pré-requisitos: Java 21, Maven 3.9+, Docker.

```bash
cp .env.example .env            # ajuste as senhas locais
docker compose up -d            # Oracle Free + DDL + seed (1ª subida leva alguns minutos)
docker compose logs -f oracle   # aguarde "DATABASE IS READY TO USE!" e a execução de 01_ddl.sql / 02_dml.sql
```

```bash
cd backend
set -a; source ../.env; set +a  # exporta DB_URL, DB_USER, DB_PASSWORD...
mvn spring-boot:run
```

- Swagger UI: <http://localhost:8080/swagger-ui.html>
- Health: <http://localhost:8080/actuator/health>

Testes: `cd backend && mvn verify` (os `*IT` usam Testcontainers/Oracle e são pulados sem Docker).

## Banco de dados

`database/01_ddl.sql` (tabelas `ZL_*`), `02_dml.sql` (seed simulado, **gerado** por `gerar_seed.py`; datas relativas a "hoje") e `03_consultas.sql` (consultas úteis na demo).
Para Oracle da FIAP: rode `01_ddl.sql` e `02_dml.sql` no seu schema e aponte `DB_URL/DB_USER/DB_PASSWORD`.

## Arquitetura

`model → dao (JdbcTemplate, SQL explícito) → bo (regra de negócio) → controller`, erros em `ProblemDetail`. Detalhes em [`docs/arquitetura.md`](docs/arquitetura.md); decisões em [`docs/decisoes.md`](docs/decisoes.md).

## Endpoints (M1)

| Método | Rota | Propósito |
|---|---|---|
| CRUD | `/api/v1/ubs`, `/api/v1/pacientes` | Cadastros |
| GET | `/api/v1/especialidades`, `/abrigos`, `/areas-risco` | Dados de referência |
| GET/POST | `/api/v1/consultas` (+ `/{id}/confirmar\|cancelar\|realizada\|falta`) | Agenda e transições de status |
| GET/POST | `/api/v1/fila` (+ `/{id}/sair`) | Fila de espera |
| GET | `/api/v1/vagas`, `/api/v1/ofertas` | Vagas e ofertas |
| GET | `/api/v1/config` | Flag do modo demo |

Os demais endpoints entram nos marcos seguintes.
