// Eventos de interface entre componentes que nao se conhecem (ex.: o celular e o painel dentro da /demo).
// So visual: nenhuma regra de negocio passa por aqui (a verdade continua sendo a API).

export const VAGA_ACEITA = 'zelo:vaga-aceita'

/** Avisa que a Dona Cida aceitou uma vaga (botao ou voz). A /demo usa para animar a "particula" ate o painel. */
export function avisarVagaAceita() {
  window.dispatchEvent(new CustomEvent(VAGA_ACEITA))
}
