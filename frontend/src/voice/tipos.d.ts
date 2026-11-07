// A API de reconhecimento de voz ainda nao esta no lib.dom do TypeScript em todos os navegadores/versoes.
interface ReconhecimentoResultado {
  readonly 0: { readonly transcript: string }
  readonly isFinal: boolean
}
interface ReconhecimentoEvento {
  readonly results: ArrayLike<ReconhecimentoResultado>
}
interface ReconhecimentoErroEvento {
  readonly error: string
}
interface ReconhecimentoVoz {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((e: ReconhecimentoEvento) => void) | null
  onerror: ((e: ReconhecimentoErroEvento) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
interface Window {
  SpeechRecognition?: new () => ReconhecimentoVoz
  webkitSpeechRecognition?: new () => ReconhecimentoVoz
}
