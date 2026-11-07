import { api, post } from './cliente'
import type {
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
