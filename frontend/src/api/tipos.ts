// Espelha os DTOs do backend (br.com.zelo.dto / model).

export interface Paciente {
  id: number
  nome: string
  idade: number
  prioridadeLegal: boolean
}

export interface Ubs {
  id: number
  nome: string
  endereco: string
  lat: number
  lng: number
}

export type ConsultaStatus =
  | 'AGENDADA'
  | 'AGUARDANDO_CONFIRMACAO'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'NAO_RESPONDIDA'
  | 'REALIZADA'
  | 'FALTA'

export interface Mensagem {
  id: number
  direcao: 'ENTRADA' | 'SAIDA'
  texto: string
  tipo: string
  criadaEm: string
}

export interface Acao {
  rotulo: string
  texto: string
}

export interface RespostaAssistente {
  resposta: string
  acoes: Acao[]
}

export interface OfertaDetalhe {
  id: number
  vagaId: number
  pacienteId: number
  pacienteNome: string
  ubsNome: string
  especialidade: string
  dataHoraVaga: string
  expiraEm: string
  status: 'PENDENTE' | 'ACEITA' | 'RECUSADA' | 'EXPIRADA'
  segundosRestantes: number
}

export interface ConsultaDetalhe {
  id: number
  pacienteNome: string
  especialidade: string
  dataHora: string
  status: ConsultaStatus
  riscoFalta: number | null
  riscoAlto: boolean
  origem: 'NORMAL' | 'ENCAIXE'
}

export interface FilaDetalhe {
  id: number
  pacienteNome: string
  especialidade: string
  gravidade: number
  diasEspera: number
  prioridadeLegal: boolean
  posicao: number
}

export interface VagaDetalhe {
  id: number
  especialidade: string
  dataHora: string
  status: 'ABERTA' | 'EM_OFERTA'
}

export interface Impacto {
  vagasRecuperadas: number
  diasEsperaEconomizados: number
  taxaComparecimento: number | null
  consultasRealizadas: number
  faltas: number
  moradoresAlertados: number
}

export interface PainelUbs {
  ubs: Ubs
  agora: string
  agenda: ConsultaDetalhe[]
  fila: FilaDetalhe[]
  vagas: VagaDetalhe[]
  ofertas: OfertaDetalhe[]
  impacto: Impacto
}

export type Intensidade = 'SILENCIOSO' | 'VIBRAR' | 'ALARME'
export type TipoLocal = 'CASA' | 'TRABALHO' | 'FAMILIA' | 'OUTRO'

export interface AreaRisco {
  id: number
  nome: string
  lat: number
  lng: number
  raioMetros: number
  limiarMmHora: number
}

export interface Abrigo {
  id: number
  nome: string
  endereco: string
  lat: number
  lng: number
}

export interface LocalSalvo {
  id: number
  apelido: string
  lat: number
  lng: number
  tipo: TipoLocal
  intensidade: Intensidade
  ativo: boolean
}

export type LocalRequest = Omit<LocalSalvo, 'id'>

export interface AlertaDetalhe {
  id: number
  localApelido: string
  intensidade: Intensidade
  areaNome: string
  chuvaMm: number
  nivel: 'ATENCAO' | 'ALTO' | 'CRITICO'
  abrigoNome: string | null
  abrigoEndereco: string | null
  abrigoDistanciaMetros: number | null
  rotaUrl: string | null
  mensagem: string
}
