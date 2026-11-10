import { reduzirMovimento } from './gsap'

const CORES = ['#0f5c57', '#f2b84b', '#1f8a7f', '#ffd27a']

/**
 * Celebracao leve (1,5 s) quando a vaga e aceita: o momento de alivio da Dona Cida merece ser visto.
 * Canvas proprio, sem biblioteca, removido ao terminar. Nao faz nada com reduced-motion.
 * `origem` = elemento de onde os papeizinhos saem.
 */
export function confete(origem?: Element | null, duracaoMs = 1500) {
  if (reduzirMovimento() || typeof document === 'undefined') return
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '90' })
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')!
  const r = origem?.getBoundingClientRect()
  const ox = r ? r.left + r.width / 2 : canvas.width / 2
  const oy = r ? r.top + r.height / 2 : canvas.height / 2

  const pedacos = Array.from({ length: 70 }, () => ({
    x: ox,
    y: oy,
    vx: (Math.random() - 0.5) * 9,
    vy: -Math.random() * 9 - 3,
    giro: Math.random() * Math.PI,
    vg: (Math.random() - 0.5) * 0.3,
    cor: CORES[Math.floor(Math.random() * CORES.length)],
    t: 5 + Math.random() * 5,
  }))
  const inicio = performance.now()
  const quadro = (agora: number) => {
    const passado = agora - inicio
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.globalAlpha = Math.max(0, 1 - passado / duracaoMs)
    for (const p of pedacos) {
      p.vy += 0.28
      p.x += p.vx
      p.y += p.vy
      p.giro += p.vg
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.giro)
      ctx.fillStyle = p.cor
      ctx.fillRect(-p.t / 2, -p.t / 4, p.t, p.t / 2)
      ctx.restore()
    }
    if (passado < duracaoMs) requestAnimationFrame(quadro)
    else canvas.remove()
  }
  requestAnimationFrame(quadro)
}
