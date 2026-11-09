// Numeros REAIS da base Kaggle "Medical Appointment No Shows", gerados por datascience/treinar_modelo.py.
// Nao edite estatisticas.json a mao: rode o script de novo.
import estatisticas from './estatisticas.json'

export const BASE = estatisticas

/** 0.202 -> "20,2%" */
export const pct = (v: number, casas = 1) =>
  `${(v * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`

export const milhar = (v: number) => v.toLocaleString('pt-BR')

/** Limiar do modelo a partir do qual o risco e "alto" (os 25% de consultas com maior risco previsto). */
export const LIMIAR_ALTO = BASE.modelo.limiarAlto

/** Nome e efeito de cada fator do modelo, em linguagem simples (o sinal vem do peso treinado). */
export const FATORES: { chave: keyof typeof BASE.modelo.pesos; nome: string; unidade: string }[] = [
  { chave: 'faltasAnteriores', nome: 'Faltas anteriores', unidade: 'a cada falta registrada' },
  { chave: 'lembreteEnviado', nome: 'Recebeu lembrete por SMS', unidade: 'sim/não' },
  { chave: 'bolsaFamilia', nome: 'Recebe Bolsa Família', unidade: 'sim/não' },
  { chave: 'diabetes', nome: 'Diabetes', unidade: 'sim/não' },
  { chave: 'diasAntecedencia', nome: 'Dias entre marcar e a consulta', unidade: 'a cada dia' },
  { chave: 'idade', nome: 'Idade', unidade: 'a cada ano' },
  { chave: 'hipertensao', nome: 'Hipertensão', unidade: 'sim/não' },
  { chave: 'deficiencia', nome: 'Deficiência', unidade: 'sim/não' },
]
