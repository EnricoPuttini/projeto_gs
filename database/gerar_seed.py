#!/usr/bin/env python3
"""Gera database/02_dml.sql de forma deterministica (random com semente fixa).
Uso: python3 database/gerar_seed.py > database/02_dml.sql
Pessoas FICTICIAS (nomes e telefones inventados), mas com perfil calibrado em dados REAIS: idade,
hipertensao, diabetes, deficiencia e Bolsa Familia seguem as taxas por faixa etaria da base Kaggle
"Medical Appointment No Shows" (frontend/src/dados/estatisticas.json, gerado por datascience/treinar_modelo.py),
e o risco de falta de cada consulta e calculado com o MESMO modelo que o backend usa (modelo-falta.json).
Bairro/UBS/corregos sao PLACEHOLDERS: edite as constantes abaixo e regere."""
import json
import math
import random
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ESTAT = json.loads((RAIZ / "frontend/src/dados/estatisticas.json").read_text(encoding="utf-8"))
MODELO = json.loads((RAIZ / "backend/src/main/resources/modelo-falta.json").read_text(encoding="utf-8"))
FAIXAS = {"0-12": (1, 12), "13-17": (13, 17), "18-39": (18, 39), "40-59": (40, 59), "60+": (60, 88)}


def faixa_de(idade):
    return next(f for f, (a, b) in FAIXAS.items() if a <= idade <= b)


def sorteia_idade():
    """Faixa etaria pela distribuicao real da base; idade uniforme dentro da faixa."""
    faixa = random.choices(list(ESTAT["distribuicaoFaixaEtaria"]), weights=ESTAT["distribuicaoFaixaEtaria"].values())[0]
    return random.randint(*FAIXAS[faixa])


def tem(condicao, idade):
    return 1 if random.random() < ESTAT["prevalenciaPorFaixaEtaria"][condicao][faixa_de(idade)] else 0


def risco(feat):
    """Regressao logistica identica a do RiscoFaltaBO."""
    z = MODELO["intercepto"] + sum(p * feat[n] for n, p in MODELO["pesos"].items())
    return round(1 / (1 + math.exp(-z)), 3)


random.seed(2026)
BAIRRO = "Bairro Exemplo (PLACEHOLDER)"
UBS = [
    (1, "UBS Exemplo Centro (PLACEHOLDER)", "Rua Exemplo, 100 - Bairro Exemplo", -23.5600, -46.6400),
    (2, "UBS Exemplo Vila Nova (PLACEHOLDER)", "Av. Exemplo, 500 - Vila Nova", -23.5700, -46.6600),
]
ESPEC = [(1, "Clinica Geral"), (2, "Pediatria"), (3, "Ginecologia"), (4, "Cardiologia")]
AREAS = [  # nome, lat, lng, raio_m, limiar mm/h
    ("Margem do Corrego Exemplo 1 (PLACEHOLDER)", -23.5640, -46.6440, 350, 15.0),
    ("Baixada do Corrego Exemplo 2 (PLACEHOLDER)", -23.5580, -46.6360, 300, 12.0),
    ("Travessa do Corrego Exemplo 3 (PLACEHOLDER)", -23.5690, -46.6580, 400, 20.0),
]
ABRIGOS = [
    ("EMEF Exemplo Alto (PLACEHOLDER)", "Rua do Alto, 10", -23.5610, -46.6420, 200),
    ("EMEI Exemplo Morro (PLACEHOLDER)", "Rua do Morro, 55", -23.5560, -46.6380, 120),
    ("EMEF Exemplo Vila (PLACEHOLDER)", "Rua da Vila, 80", -23.5720, -46.6620, 250),
]
NOMES = ["Maria Aparecida", "Jose Antonio", "Ana Lucia", "Joao Batista", "Francisca Souza", "Antonio Carlos",
         "Marcia Regina", "Paulo Roberto", "Sandra Oliveira", "Carlos Eduardo", "Luzia Ferreira", "Pedro Henrique",
         "Rita de Cassia", "Sebastiao Lima", "Teresa Cristina", "Manoel Pereira", "Helena Santos", "Roberto Alves",
         "Vera Lucia", "Jorge Luiz", "Edna Martins", "Fabio Rocha", "Cleide Barbosa", "Marcos Vinicius",
         "Neusa Ribeiro", "Claudio Gomes", "Josefa Araujo", "Reinaldo Cardoso", "Tania Moreira", "Walter Dias",
         "Aline Costa", "Bruno Teixeira", "Camila Nunes", "Diego Freitas", "Elaine Castro", "Gustavo Melo",
         "Patricia Lopes", "Rafael Monteiro", "Simone Duarte", "Thiago Ramos"]
SOBRENOMES = ["da Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Rodrigues", "Almeida"]

out = []
w = out.append
w("-- ZELO - seed SIMULADO. GERADO por database/gerar_seed.py - nao edite a mao.")
w("-- Dados 100% ficticios. Bairro, UBS e corregos sao PLACEHOLDERS (ver TODO-EQUIPE.md).")
w("-- Datas sao relativas a hoje (fuso Sao Paulo) para o roteiro da demo funcionar em qualquer dia.")
w("ALTER SESSION SET TIME_ZONE = 'America/Sao_Paulo';")
for i, n, e, la, ln in UBS:
    w(f"INSERT INTO ZL_UBS (ID,NOME,ENDERECO,LAT,LNG) VALUES ({i},'{n}','{e}',{la},{ln});")
for i, n in ESPEC:
    w(f"INSERT INTO ZL_ESPECIALIDADE (ID,NOME) VALUES ({i},'{n}');")

# Pacientes: id 1 e a Dona Cida (persona), 64 anos. Casas espalhadas ~1,5 km das UBS.
pacs = []
perfil = {}
for pid in range(1, 41):
    nome = "Cida Santos" if pid == 1 else f"{NOMES[pid-1]} {random.choice(SOBRENOMES)}"
    gest = 1 if pid in (11, 23) else 0
    idade = 64 if pid == 1 else (random.randint(19, 36) if gest else sorteia_idade())
    ubs = UBS[0] if pid <= 28 else UBS[1]
    lat = round(ubs[3] + random.uniform(-0.012, 0.012), 6)
    lng = round(ubs[4] + random.uniform(-0.012, 0.012), 6)
    if pid == 1:
        lat, lng = -23.5645, -46.6445  # dentro da area de risco 1 (demo de chuva)
    # Dona Cida (persona) e hipertensa e diabetica por definicao do roteiro; os demais seguem as taxas reais.
    hip = 1 if pid == 1 else tem("hipertensao", idade)
    dia = 1 if pid == 1 else tem("diabetes", idade)
    defi = tem("deficiencia", idade)
    bolsa = tem("bolsaFamilia", idade)
    pcd = 1 if defi else 0
    faltas = random.choices([0, 1, 2, 3], weights=[75, 15, 7, 3])[0]
    pacs.append((pid, idade, gest))
    perfil[pid] = {"idade": idade, "bolsaFamilia": bolsa, "hipertensao": hip, "diabetes": dia,
                   "deficiencia": defi, "lembreteEnviado": 0, "faltasAnteriores": faltas}
    w(f"INSERT INTO ZL_PACIENTE (ID,NOME,DT_NASC,TELEFONE,LAT,LNG,HIPERTENSAO,DIABETES,DEFICIENCIA,BOLSA_FAMILIA,GESTANTE,PCD,FALTAS_ANT) "
      f"VALUES ({pid},'{nome}',ADD_MONTHS(TRUNC(CURRENT_DATE),-{idade*12+random.randint(1,11)}),'(11) 90000-{pid:04d}',{lat},{lng},{hip},{dia},{defi},{bolsa},{gest},{pcd},{faltas});")

# Agenda de 7 dias. Todos em AGENDADA, exceto as consultas de amanha da UBS 1 que ja estao
# em AGUARDANDO_CONFIRMACAO (o job D-1 as processa). Id 2 (Seu Jose) tem consulta amanha 09:00 na UBS 1,
# Clinica Geral: e quem "cancela" na demo e libera a vaga que vai para a Dona Cida (fila, id 1).
cid = 0
horas = [8, 9, 10, 11, 14]
cons = []
for dia in range(0, 7):
    for ubs_id, qtd in ((1, 5), (2, 3)):
        for k in range(qtd):
            cid += 1
            esp = [1, 4, 1, 3, 2][k] if ubs_id == 1 else [1, 2, 3][k]
            pac = 2 if (dia == 1 and ubs_id == 1 and k == 0) else 2 + ((cid * 7) % 38)
            if pac == 1: pac = 3
            h = horas[k]
            status = "AGUARDANDO_CONFIRMACAO" if (dia == 1 and ubs_id == 1) else "AGENDADA"
            # Consultas foram marcadas 10 dias atras (CRIADA_EM), entao a antecedencia e dia + 10.
            risco_falta = risco({**perfil[pac], "diasAntecedencia": dia + 10})
            cons.append((cid, pac, ubs_id, esp, dia, h))
            w(f"INSERT INTO ZL_CONSULTA (ID,PACIENTE_ID,UBS_ID,ESPEC_ID,DATA_HORA,STATUS,RISCO_FALTA,ORIGEM,LEMBRETE_ENVIADO,CRIADA_EM) "
              f"VALUES ({cid},{pac},{ubs_id},{esp},TRUNC(CURRENT_DATE)+{dia}+{h}/24,'{status}',{risco_falta},'NORMAL',0,TRUNC(CURRENT_DATE)-10);")

# Dona Cida tambem tem uma consulta propria (Cardiologia, daqui a 5 dias): assim, fora da demo, a voz
# tem o que responder ("minha consulta", "cancelar consulta"). Fica no fim para nao mudar os ids anteriores.
cid += 1
w(f"INSERT INTO ZL_CONSULTA (ID,PACIENTE_ID,UBS_ID,ESPEC_ID,DATA_HORA,STATUS,RISCO_FALTA,ORIGEM,LEMBRETE_ENVIADO,CRIADA_EM) "
  f"VALUES ({cid},1,1,4,TRUNC(CURRENT_DATE)+5+10/24,'AGENDADA',{risco({**perfil[1], 'diasAntecedencia': 15})},'NORMAL',0,TRUNC(CURRENT_DATE)-10);")

# Fila: ~25 pessoas. UBS1/Clinica Geral tem 12 (Dona Cida no topo: idosa, gravidade 3, 90 dias de espera).
fila = [(1, 1, 1, 3, 90)]
cg = [5, 9, 13, 17, 21, 25, 29, 33, 37, 40, 12]  # outros 11 na fila de Clinica Geral UBS 1
for p in cg: fila.append((p, 1, 1, random.choice([1, 2, 2, 3]), random.randint(5, 80)))
for p in (4, 8, 14, 18, 22, 26): fila.append((p, 1, 4, random.choice([2, 3]), random.randint(10, 120)))   # cardiologia
for p in (6, 10, 16, 24): fila.append((p, 2, 2, random.choice([1, 2]), random.randint(5, 60)))            # pediatria UBS 2
for p in (11, 23, 27): fila.append((p, 1, 3, 2, random.randint(5, 50)))                                    # ginecologia
for i, (p, u, e, g, d) in enumerate(fila, 1):
    w(f"INSERT INTO ZL_FILA (ID,PACIENTE_ID,UBS_ID,ESPEC_ID,DATA_ENTRADA,GRAVIDADE,STATUS) "
      f"VALUES ({i},{p},{u},{e},TRUNC(CURRENT_DATE)-{d}+9/24,{g},'ATIVA');")

for i, (n, la, ln, r, l) in enumerate(AREAS, 1):
    w(f"INSERT INTO ZL_AREA_RISCO (ID,NOME,LAT,LNG,RAIO_M,LIMIAR_MM) VALUES ({i},'{n}',{la},{ln},{r},{l});")
for i, (n, e, la, ln, c) in enumerate(ABRIGOS, 1):
    w(f"INSERT INTO ZL_ABRIGO (ID,NOME,ENDERECO,LAT,LNG,CAPACIDADE) VALUES ({i},'{n}','{e}',{la},{ln},{c});")

# Cada paciente tem o local "Casa" (alerta VIBRAR; Dona Cida usa ALARME, ver demo).
for pid, _, _ in pacs:
    inten = "ALARME" if pid == 1 else "VIBRAR"
    w(f"INSERT INTO ZL_LOCAL_SALVO (ID,PACIENTE_ID,APELIDO,LAT,LNG,TIPO,INTENSIDADE,ATIVO) "
      f"SELECT {pid},ID,'Casa',LAT,LNG,'CASA','{inten}',1 FROM ZL_PACIENTE WHERE ID={pid};")

# Realinha os contadores IDENTITY apos inserir IDs explicitos (senao o proximo INSERT colide).
for t in ("ZL_UBS", "ZL_ESPECIALIDADE", "ZL_PACIENTE", "ZL_CONSULTA", "ZL_FILA", "ZL_VAGA", "ZL_OFERTA",
          "ZL_MENSAGEM", "ZL_LOCAL_SALVO", "ZL_AREA_RISCO", "ZL_ABRIGO", "ZL_ALERTA"):
    w(f"ALTER TABLE {t} MODIFY ID GENERATED BY DEFAULT AS IDENTITY (START WITH LIMIT VALUE);")
w("COMMIT;")
print("\n".join(out))
