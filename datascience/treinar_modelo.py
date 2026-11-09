"""
Treina o modelo de risco de falta do Zelo com dados REAIS e gera os arquivos que o sistema usa.

Base: "Medical Appointment No Shows" (Kaggle, Joni Hoppen) — 110.527 consultas do SUS em
Vitoria/ES, abril a junho de 2016, com pacientes anonimizados. Licenca CC BY-NC-SA 4.0 (uso
educacional, nao comercial). O CSV NAO e versionado: o script baixa uma copia publica.

Uso (na raiz do repositorio):
    python -m venv datascience/.venv
    datascience/.venv/Scripts/python -m pip install pandas scikit-learn   (Linux/Mac: .venv/bin/python)
    datascience/.venv/Scripts/python datascience/treinar_modelo.py

Saidas:
    backend/src/main/resources/modelo-falta.json  -> coeficientes lidos pelo RiscoFaltaBO (sem mudar codigo)
    frontend/src/dados/estatisticas.json           -> taxas reais: calibram o seed (gerar_seed.py) e aparecem no site
"""
import json
import urllib.request
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

RAIZ = Path(__file__).resolve().parent.parent
CSV = RAIZ / "datascience" / "dados" / "KaggleV2-May-2016.csv"
URL_COPIA = ("https://raw.githubusercontent.com/abhirup-ghosh/medical-appointment-no-shows/"
             "HEAD/data/KaggleV2-May-2016.csv")
LINHAS_ESPERADAS = 110_527  # tamanho documentado no Kaggle: confere que a copia esta inteira

# Mesmos nomes de feature que o RiscoFaltaBO conhece (ordem nao importa).
FEATURES = ["idade", "diasAntecedencia", "bolsaFamilia", "hipertensao", "diabetes",
            "deficiencia", "lembreteEnviado", "faltasAnteriores"]


def carregar() -> pd.DataFrame:
    if not CSV.exists():
        CSV.parent.mkdir(parents=True, exist_ok=True)
        print(f"Baixando a base de {URL_COPIA} ...")
        urllib.request.urlretrieve(URL_COPIA, CSV)
    df = pd.read_csv(CSV)
    if len(df) != LINHAS_ESPERADAS:
        raise SystemExit(f"Base com {len(df)} linhas; esperado {LINHAS_ESPERADAS}. Copia incompleta?")
    return df


def preparar(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    agendada = pd.to_datetime(df["ScheduledDay"]).dt.normalize()
    consulta = pd.to_datetime(df["AppointmentDay"]).dt.normalize()
    df["diasAntecedencia"] = (consulta - agendada).dt.days
    df["faltou"] = (df["No-show"] == "Yes").astype(int)

    # Limpeza documentada: idade negativa e consulta "antes" do agendamento sao erros de digitacao da base.
    antes = len(df)
    df = df[(df["Age"] >= 0) & (df["diasAntecedencia"] >= 0)].copy()
    print(f"Linhas removidas na limpeza: {antes - len(df)}")

    # Faltas ANTERIORES do mesmo paciente (so o que ja tinha acontecido antes desta consulta, sem vazar o futuro).
    df = df.sort_values(["PatientId", "AppointmentDay", "AppointmentID"])
    df["faltasAnteriores"] = df.groupby("PatientId")["faltou"].cumsum() - df["faltou"]

    return df.rename(columns={"Age": "idade", "Scholarship": "bolsaFamilia", "Hipertension": "hipertensao",
                              "Diabetes": "diabetes", "SMS_received": "lembreteEnviado"}).assign(
        deficiencia=lambda d: (d["Handcap"] > 0).astype(int))


def main() -> None:
    df = preparar(carregar())
    x, y = df[FEATURES].astype(float), df["faltou"]
    x_tr, x_te, y_tr, y_te = train_test_split(x, y, test_size=0.25, random_state=2026, stratify=y)

    modelo = LogisticRegression(max_iter=2000)
    modelo.fit(x_tr, y_tr)
    prob = modelo.predict_proba(x_te)[:, 1]
    auc = roc_auc_score(y_te, prob)

    # Limiar "alto": os 25% de consultas com maior risco previsto recebem lembrete extra e destaque no painel.
    limiar = float(np.quantile(modelo.predict_proba(x_tr)[:, 1], 0.75))
    alto = prob >= limiar
    taxa_no_grupo_alto = float(y_te[alto].mean())
    taxa_geral = float(y.mean())

    pesos = {f: round(float(c), 5) for f, c in zip(FEATURES, modelo.coef_[0])}
    saida_modelo = {
        "versao": "TREINADO-KAGGLE-2016",
        "observacao": "Regressao logistica treinada em 110.527 consultas reais (Kaggle Medical Appointment No Shows, "
                      "Vitoria/ES, 2016). Gerado por datascience/treinar_modelo.py; nao edite a mao.",
        "intercepto": round(float(modelo.intercept_[0]), 5),
        "limiarAlto": round(limiar, 3),
        "pesos": pesos,
        "metricas": {
            "aucTeste": round(auc, 3),
            "consultasTreino": int(len(x_tr)),
            "consultasTeste": int(len(x_te)),
            "taxaFaltaGeral": round(taxa_geral, 3),
            "taxaFaltaNoGrupoAlto": round(taxa_no_grupo_alto, 3),
        },
    }
    (RAIZ / "backend/src/main/resources/modelo-falta.json").write_text(
        json.dumps(saida_modelo, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Taxas reais por perfil: calibram o seed e alimentam a pagina "Como funciona".
    faixas = pd.cut(df["idade"], [-1, 12, 17, 39, 59, 200], labels=["0-12", "13-17", "18-39", "40-59", "60+"])
    estat = {
        "fonte": "Kaggle - Medical Appointment No Shows (Joni Hoppen), CC BY-NC-SA 4.0",
        "consultas": int(len(df)),
        "pacientes": int(df["PatientId"].nunique()),
        "taxaFalta": round(taxa_geral, 3),
        "prevalencia": {c: round(float(df[c].mean()), 3) for c in
                        ["bolsaFamilia", "hipertensao", "diabetes", "deficiencia", "lembreteEnviado"]},
        "idadeMedia": round(float(df["idade"].mean()), 1),
        "diasAntecedenciaMediana": int(df["diasAntecedencia"].median()),
        "prevalenciaPorFaixaEtaria": {c: {str(k): round(float(v), 3) for k, v in df.groupby(faixas, observed=True)[c].mean().items()}
                                      for c in ["bolsaFamilia", "hipertensao", "diabetes", "deficiencia"]},
        "distribuicaoFaixaEtaria": {str(k): round(float(v), 3) for k, v in faixas.value_counts(normalize=True).sort_index().items()},
        "taxaFaltaPorFaixaEtaria": {str(k): round(float(v), 3) for k, v in df.groupby(faixas, observed=True)["faltou"].mean().items()},
        "taxaFaltaComFaltaAnterior": round(float(df[df["faltasAnteriores"] > 0]["faltou"].mean()), 3),
        "taxaFaltaSemFaltaAnterior": round(float(df[df["faltasAnteriores"] == 0]["faltou"].mean()), 3),
        "taxaFaltaMesmoDia": round(float(df[df["diasAntecedencia"] == 0]["faltou"].mean()), 3),
        "taxaFalta15DiasOuMais": round(float(df[df["diasAntecedencia"] >= 15]["faltou"].mean()), 3),
        "modelo": {**saida_modelo["metricas"], "limiarAlto": saida_modelo["limiarAlto"], "pesos": pesos},
    }
    destino = RAIZ / "frontend/src/dados/estatisticas.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(estat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({"pesos": pesos, "intercepto": saida_modelo["intercepto"], "limiarAlto": saida_modelo["limiarAlto"],
                      **saida_modelo["metricas"]}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
