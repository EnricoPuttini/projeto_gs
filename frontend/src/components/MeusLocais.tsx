import { useState } from 'react'
import { ApiError } from '../api/cliente'
import { atualizarLocal, criarLocal, listarLocais } from '../api/endpoints'
import type { Intensidade, LocalRequest, LocalSalvo, TipoLocal } from '../api/tipos'
import { usePolling } from '../hooks/usePolling'
import { Carregando, Erro, Vazio } from './Estados'

const INTENSIDADES: { valor: Intensidade; rotulo: string; ajuda: string }[] = [
  { valor: 'SILENCIOSO', rotulo: 'Silencioso', ajuda: 'só aparece na tela' },
  { valor: 'VIBRAR', rotulo: 'Vibrar', ajuda: 'a tela e o celular vibram' },
  { valor: 'ALARME', rotulo: 'Alarme', ajuda: 'vibra e toca uma sirene' },
]
const TIPOS: { valor: TipoLocal; rotulo: string }[] = [
  { valor: 'CASA', rotulo: 'Casa' },
  { valor: 'TRABALHO', rotulo: 'Trabalho' },
  { valor: 'FAMILIA', rotulo: 'Casa de família' },
  { valor: 'OUTRO', rotulo: 'Outro' },
]

const paraRequisicao = (l: LocalSalvo, mudanca: Partial<LocalRequest>): LocalRequest => ({
  apelido: l.apelido,
  lat: l.lat,
  lng: l.lng,
  tipo: l.tipo,
  intensidade: l.intensidade,
  ativo: l.ativo,
  ...mudanca,
})

function CartaoLocal({ local, aoMudar }: { local: LocalSalvo; aoMudar: (m: Partial<LocalRequest>) => void }) {
  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">{local.apelido}</h2>
        <button
          type="button"
          role="switch"
          aria-checked={local.ativo}
          aria-label={`Avisar sobre ${local.apelido}`}
          onClick={() => aoMudar({ ativo: !local.ativo })}
          className={`min-h-11 min-w-24 rounded-full border-2 px-4 text-base font-bold ${
            local.ativo ? 'border-petroleo bg-petroleo text-white' : 'border-tinta/50 text-tinta'
          }`}
        >
          {local.ativo ? 'Avisando' : 'Desligado'}
        </button>
      </div>

      <fieldset className="mt-3">
        <legend className="text-base font-bold">Como avisar</legend>
        <div className="mt-1 grid gap-2">
          {INTENSIDADES.map((i) => (
            <label
              key={i.valor}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 text-lg ${
                local.intensidade === i.valor ? 'border-petroleo bg-[#dcebe6]' : 'border-petroleo/20'
              }`}
            >
              <input
                type="radio"
                name={`intensidade-${local.id}`}
                checked={local.intensidade === i.valor}
                onChange={() => aoMudar({ intensidade: i.valor })}
                className="size-5 accent-petroleo"
              />
              <span>
                <span className="font-bold">{i.rotulo}</span> <span className="text-base text-tinta/80">· {i.ajuda}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </li>
  )
}

function NovoLocal({ pacienteId, aoCriar }: { pacienteId: number; aoCriar: () => void }) {
  const [apelido, setApelido] = useState('')
  const [tipo, setTipo] = useState<TipoLocal>('CASA')
  const [intensidade, setIntensidade] = useState<Intensidade>('VIBRAR')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  function usarMinhaLocalizacao() {
    setErro(null)
    if (!('geolocation' in navigator)) {
      setErro('Este aparelho não informa a localização. Digite a latitude e a longitude.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6))
        setLng(pos.coords.longitude.toFixed(6))
      },
      () => setErro('Não consegui descobrir onde você está. Libere a localização ou digite as coordenadas.'),
      { timeout: 8000 },
    )
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const la = Number(lat.replace(',', '.'))
    const ln = Number(lng.replace(',', '.'))
    if (!apelido.trim() || lat.trim() === '' || lng.trim() === '' || Number.isNaN(la) || Number.isNaN(ln)) {
      setErro('Dê um nome ao local e informe a latitude e a longitude.')
      return
    }
    setOcupado(true)
    setErro(null)
    try {
      await criarLocal(pacienteId, { apelido: apelido.trim(), lat: la, lng: ln, tipo, intensidade, ativo: true })
      setApelido('')
      setLat('')
      setLng('')
      aoCriar()
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não consegui salvar. Tente de novo.')
    } finally {
      setOcupado(false)
    }
  }

  const campo = 'min-h-12 w-full rounded-xl border-2 border-petroleo/40 bg-white px-3 text-lg'
  return (
    <form onSubmit={(e) => void salvar(e)} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-xl font-extrabold">Adicionar um local</h2>
      <label className="block text-base font-bold">
        Nome do local
        <input value={apelido} onChange={(e) => setApelido(e.target.value)} placeholder="Ex.: Casa da minha filha" maxLength={60} className={campo} />
      </label>
      <label className="block text-base font-bold">
        Tipo
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoLocal)} className={campo}>
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>{t.rotulo}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={usarMinhaLocalizacao}
        className="min-h-12 w-full rounded-xl border-2 border-petroleo px-3 text-lg font-bold text-petroleo"
      >
        Usar onde estou agora
      </button>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-base font-bold">
          Latitude
          <input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" placeholder="-23.5645" className={campo} />
        </label>
        <label className="block text-base font-bold">
          Longitude
          <input value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" placeholder="-46.6445" className={campo} />
        </label>
      </div>
      <label className="block text-base font-bold">
        Como avisar
        <select value={intensidade} onChange={(e) => setIntensidade(e.target.value as Intensidade)} className={campo}>
          {INTENSIDADES.map((i) => (
            <option key={i.valor} value={i.valor}>{i.rotulo} · {i.ajuda}</option>
          ))}
        </select>
      </label>
      {erro && (
        <p role="alert" className="text-base font-semibold text-alerta">
          {erro}
        </p>
      )}
      <button type="submit" disabled={ocupado} className="min-h-14 w-full rounded-xl bg-petroleo text-xl font-extrabold text-white disabled:opacity-60">
        {ocupado ? 'Salvando…' : 'Salvar local'}
      </button>
    </form>
  )
}

/** Aba "Meus locais": onde avisar e com que intensidade. */
export function MeusLocais({ pacienteId }: { pacienteId: number }) {
  const locais = usePolling(() => listarLocais(pacienteId), 15_000, pacienteId)
  const [erro, setErro] = useState<string | null>(null)

  async function mudar(local: LocalSalvo, mudanca: Partial<LocalRequest>) {
    setErro(null)
    try {
      await atualizarLocal(local.id, paraRequisicao(local, mudanca))
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não consegui salvar a mudança.')
    } finally {
      locais.atualizar()
    }
  }

  return (
    <section aria-label="Meus locais" className="flex-1 space-y-3 overflow-y-auto p-3">
      <p className="text-lg">Escolha onde você quer ser avisado quando a chuva forte estiver chegando.</p>
      {locais.carregando && <Carregando texto="Buscando seus locais…" />}
      {locais.erro && !locais.dados && <Erro mensagem={locais.erro} aoTentar={locais.atualizar} />}
      {erro && (
        <p role="alert" className="rounded-lg bg-alerta p-2 text-base font-semibold text-white">
          {erro}
        </p>
      )}
      {locais.dados && locais.dados.length === 0 && <Vazio>Você ainda não tem nenhum local. Adicione o primeiro abaixo.</Vazio>}
      <ul className="space-y-3">
        {locais.dados?.map((l) => (
          <CartaoLocal key={l.id} local={l} aoMudar={(m) => void mudar(l, m)} />
        ))}
      </ul>
      <NovoLocal pacienteId={pacienteId} aoCriar={locais.atualizar} />
    </section>
  )
}
