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

> Status: **M4 em andamento** — código, Docker e roteiro prontos; falta a equipe criar os serviços no Render (ver [`TODO-EQUIPE.md`](TODO-EQUIPE.md)).

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

## Como fazer deploy (Render)

O `render.yaml` na raiz descreve os dois serviços. O backend é um **Web Service Docker** (`backend/Dockerfile`, contexto na raiz do repositório) e o frontend um **Static Site**.

1. No Render: **New + → Blueprint**, escolha este repositório e aprove `zelo-api` e `zelo-app`.
2. Preencha as variáveis (nada disso vai para o Git):

| Serviço | Variável | Valor |
|---|---|---|
| zelo-api | `DB_URL` | `jdbc:oracle:thin:@//HOST:1521/SERVICE` (ou `@HOST:1521:SID`) |
| zelo-api | `DB_USER` / `DB_PASSWORD` | credenciais do schema |
| zelo-api | `CORS_ORIGINS` | URL do `zelo-app`, sem barra final |
| zelo-api | `ZELO_DEMO_MODE` | `false`; `true` só no dia da demo |
| zelo-app | `VITE_API_URL` | URL do `zelo-api`, sem barra final |

3. Rode `database/01_ddl.sql` e `database/02_dml.sql` no schema do Oracle (uma vez).
4. Teste: `https://SEU-API.onrender.com/actuator/health` deve responder `UP`; depois abra o `zelo-app`.

> O Render **não entra em rede privada**. O Oracle da FIAP precisa aceitar conexões vindas da internet; se só abrir pela rede/VPN da FIAP, o deploy não conecta e é preciso outro Oracle para a demo online.
> Plano free: o backend dorme após inatividade e leva cerca de 50 s para acordar. Acorde-o antes da demo (ver [`docs/roteiro-demo.md`](docs/roteiro-demo.md)).

Variáveis de ambiente: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `CORS_ORIGINS`, `ZELO_DEMO_MODE` (backend) e `VITE_API_URL` (frontend). Opcionais: `zelo.encaixe.oferta-minutos` (15), `zelo.confirmacao.horas-limite-sem-resposta` (4), `zelo.impacto.espera-regular-dias` (45).

## Dados reais e modelo de risco

O risco de falta é uma regressão logística **treinada em 110.521 consultas reais** do SUS (Vitória-ES, 2016), base pública [*Medical Appointment No Shows*](https://www.kaggle.com/datasets/joniarroba/noshowappointments) (Kaggle, licença CC BY-NC-SA 4.0). AUC de 0,674 em teste.

```bash
python -m venv datascience/.venv
datascience/.venv/Scripts/python -m pip install pandas scikit-learn   # Linux/Mac: datascience/.venv/bin/python
datascience/.venv/Scripts/python datascience/treinar_modelo.py
python database/gerar_seed.py > database/02_dml.sql
```

O script baixa a base (o CSV não é versionado), gera `backend/src/main/resources/modelo-falta.json` (lido pelo backend sem mudar código) e `frontend/src/dados/estatisticas.json` (taxas reais mostradas no site e usadas para calibrar o seed). Os pacientes continuam fictícios.

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
