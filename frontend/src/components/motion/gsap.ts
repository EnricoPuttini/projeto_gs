// Ponto unico de registro do GSAP: todo componente importa daqui, entao o plugin e registrado uma vez.
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export { gsap, ScrollTrigger, useGSAP }

/** true se a pessoa pediu menos movimento no sistema operacional. Lido na hora (nao cacheado). */
export const reduzirMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Mouse/trackpad de precisao (cursor customizado e efeito magnetico so fazem sentido aqui). */
export const ponteiroFino = () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
