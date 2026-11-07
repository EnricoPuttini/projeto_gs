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

> Status: **M3 concluído** (alertas de enchente, "Meus locais", modo demo, indicadores). Falta o M4 (deploy no Render e roteiro da demo). Veja `docs/` e `TODO-EQUIPE.md`.

## Como rodar local

Pré-requisitos: Java 21, Maven 3.9+, Node 20+, Docker.

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

Frontend (outro terminal):

```bash
cd frontend
cp .env.example .env            # VITE_API_URL=http://localhost:8080
npm install && npm run dev
```

- Demo (celular + painel, com botões): <http://localhost:5173/demo> (exige `ZELO_DEMO_MODE=true` no backend; o `.env.example` já liga)
- App do cidadão: <http://localhost:5173/cidadao> (use `?paciente=1` para a Dona Cida)
- Painel da UBS: <http://localhost:5173/ubs>
- Swagger UI: <http://localhost:8080/swagger-ui.html>
- Health: <http://localhost:8080/actuator/health>

Testes: `cd backend && mvn verify` (os `*IT`, inclusive o de concorrência do encaixe, usam Testcontainers/Oracle e são pulados sem Docker). Frontend: `cd frontend && npm run build`.

## Banco de dados

`database/01_ddl.sql` (tabelas `ZL_*`), `02_dml.sql` (seed simulado, **gerado** por `gerar_seed.py`; datas relativas a "hoje") e `03_consultas.sql` (consultas úteis na demo).
Para Oracle da FIAP: rode `01_ddl.sql` e `02_dml.sql` no seu schema e aponte `DB_URL/DB_USER/DB_PASSWORD`.

## Arquitetura

`model → dao (JdbcTemplate, SQL explícito) → bo (regra de negócio) → controller`, erros em `ProblemDetail`. Detalhes em [`docs/arquitetura.md`](docs/arquitetura.md); decisões em [`docs/decisoes.md`](docs/decisoes.md).

## Endpoints

| Método | Rota | Propósito |
|---|---|---|
| CRUD | `/api/v1/ubs`, `/api/v1/pacientes` | Cadastros |
| GET | `/api/v1/especialidades`, `/abrigos`, `/areas-risco` | Dados de referência |
| GET/POST | `/api/v1/consultas` (+ `/{id}/confirmar|cancelar|realizada|falta`) | Agenda e transições de status |
| GET/POST | `/api/v1/fila` (+ `/{id}/sair`) | Fila de espera |
| GET | `/api/v1/vagas` | Vagas da UBS |
| GET | `/api/v1/ofertas?ubsId=` ou `?pacienteId=` | Ofertas (com segundos restantes) |
| POST | `/api/v1/ofertas/{id}/aceitar|recusar` | Responde a oferta de vaga |
| POST | `/api/v1/assistente/mensagens` | Conversa com o Zelo (texto ou voz já transcrita) |
| GET | `/api/v1/pacientes/{id}/mensagens` | Histórico do chat |
| GET | `/api/v1/painel/ubs/{id}` | Agenda, fila, vagas, ofertas e impacto em uma chamada |
| GET/POST | `/api/v1/pacientes/{id}/locais` · PUT `/api/v1/locais/{id}` | Meus locais e intensidade do alerta |
| GET | `/api/v1/pacientes/{id}/alertas?ativos=true` | Alertas de enchente do morador |
| POST | `/api/v1/alertas/{id}/seguro` | "Estou seguro" |
| GET | `/api/v1/config` | Flag do modo demo |
| POST | `/api/v1/demo/cancelar-consulta|chuva|avancar-relogio|resetar` | Modo demo (404 se `ZELO_DEMO_MODE` não for `true`) |

O job de alertas consulta a [Open-Meteo](https://open-meteo.com) a cada 15 min; se a API cair, o sistema segue e só registra o erro.
