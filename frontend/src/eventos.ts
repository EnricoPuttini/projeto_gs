// Eventos de interface entre componentes que nao se conhecem (ex.: o celular e o painel dentro da /demo).
// So visual: nenhuma regra de negocio passa por aqui (a verdade continua sendo a API).

export const VAGA_ACEITA = 'zelo:vaga-aceita'
export const ESTOU_SEGURO = 'zelo:estou-seguro'

/** Avisa que a Dona Cida aceitou uma vaga (botao ou voz). A /demo usa para animar a "particula" ate o painel. */
export function avisarVagaAceita() {
  window.dispatchEvent(new CustomEvent(VAGA_ACEITA))
}

/** Avisa que a Dona Cida confirmou que esta segura (botao do alerta ou voz). Fecha o passo da enchente na /demo. */
export function avisarSeguro() {
  window.dispatchEvent(new CustomEvent(ESTOU_SEGURO))
}
