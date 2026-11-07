import { api, post } from './cliente'
import type {
  AlertaDetalhe,
  LocalRequest,
  LocalSalvo,
  Mensagem,
  OfertaDetalhe,
  PainelUbs,
  Paciente,
  RespostaAssistente,
  Ubs,
} from './tipos'

export const buscarPaciente = (id: number) => api<Paciente>(`/pacientes/${id}`)
export const listarUbs = () => api<Ubs[]>('/ubs')
export const historico = (pacienteId: number) => api<Mensagem[]>(`/pacientes/${pacienteId}/mensagens`)
export const ofertasPendentes = (pacienteId: number) =>
  api<OfertaDetalhe[]>(`/ofertas?pacienteId=${pacienteId}&status=PENDENTE`)
export const enviarMensagem = (pacienteId: number, texto: string) =>
  post<RespostaAssistente>('/assistente/mensagens', { pacienteId, texto })
export const aceitarOferta = (id: number) => post<unknown>(`/ofertas/${id}/aceitar`)
export const recusarOferta = (id: number) => post<unknown>(`/ofertas/${id}/recusar`)
export const painelUbs = (ubsId: number) => api<PainelUbs>(`/painel/ubs/${ubsId}`)

export const listarLocais = (pacienteId: number) => api<LocalSalvo[]>(`/pacientes/${pacienteId}/locais`)
export const criarLocal = (pacienteId: number, corpo: LocalRequest) =>
  post<LocalSalvo>(`/pacientes/${pacienteId}/locais`, corpo)
export const atualizarLocal = (id: number, corpo: LocalRequest) =>
  api<LocalSalvo>(`/locais/${id}`, { method: 'PUT', body: JSON.stringify(corpo) })
export const alertasAtivos = (pacienteId: number) =>
  api<AlertaDetalhe[]>(`/pacientes/${pacienteId}/alertas?ativos=true`)
export const confirmarSeguro = (alertaId: number) => post<unknown>(`/alertas/${alertaId}/seguro`)

export const configuracao = () => api<{ demoMode: boolean }>('/config')
export const demoCancelarConsulta = () => post<unknown>('/demo/cancelar-consulta')
export const demoChuva = (areaId = 1) => post<{ alertasCriados: number }>(`/demo/chuva?areaId=${areaId}`)
export const demoAvancarRelogio = (minutos = 15) => post<{ agora: string }>(`/demo/avancar-relogio?minutos=${minutos}`)
export const demoResetar = () => post<unknown>('/demo/resetar')
