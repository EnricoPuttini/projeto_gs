# O que depende da equipe

| # | Item | Quando | Quem |
|---|---|---|---|
| 1 | Bairro/cidade, UBS (nome e endereço **públicos**) e 3 córregos reais → editar constantes em `database/gerar_seed.py` e rodar `python3 database/gerar_seed.py > database/02_dml.sql` | antes do M4 | equipe |
| 2 | Host, porta e service name do Oracle da FIAP + confirmar se aceita conexão vinda da internet (Render) | até M3 | equipe |
| 3 | Qual padrão de DAO o professor ensinou (JdbcTemplate ok?) | até M2 | equipe |
| 4 | Coeficientes do notebook de Data Science (`modelo-falta.json`) | até M3 | Data Science |
| 5 | Conta no Render (backend web service + static site) e plano | M4 | equipe |
| 6 | Preencher a Ficha da CitizenTech no `README.md` (nomes e RMs) | M4 | equipe |
| 7 | Validar `docker compose up` e o `mvn verify` com Docker na máquina de vocês (aqui não havia Docker) | agora | equipe |
| 8 | **Rodar o teste de concorrência** (`EncaixeConcorrenciaIT`) e o `UbsDAOIT` com Docker: `cd backend && mvn verify`. É a prova da regra "nunca 2 ofertas PENDENTES"; aqui ele foi pulado por falta de Docker | agora | equipe |
| 9 | Confirmar com a UBS (ou o professor) a premissa de **espera regular = 45 dias** usada em "dias economizados" (`zelo.impacto.espera-regular-dias`) | até M3 | equipe |
| 10 | Testar a voz no Chrome/Edge (Web Speech API) com microfone real; Firefox cai para texto | M2 | equipe |
| 11 | Conferir que as coordenadas do seed (UBS, áreas de risco, abrigos) e a casa da Dona Cida batem com o bairro real escolhido; o alerta só dispara para locais dentro do raio da área | antes do M4 | equipe |
| 12 | Testar a demo completa no Chrome com som: `/demo` → "Simular chuva forte" (sirene + vibração no celular real) | M3 | equipe |
