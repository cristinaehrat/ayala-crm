import { useState, useMemo, useEffect } from 'react'
import { Navigation, ExternalLink, Copy, Check, AlertCircle, MapPin, Clock, Route, List, MessageCircle, CalendarDays, ChevronDown, Pencil, Trash2, Plus, Map, AtSign, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { UF_OPTIONS } from '@/lib/utils'
import { useGerarRoteiro, parseLeadsFromText, type RoteirizarResult, type Rota, type DiaDado } from '@/hooks/useGerarRoteiro'
import { useMalhaEstrategica, useCreateMalha, useUpdateMalha, useDeleteMalha, MESES_PT } from '@/hooks/useMalhaEstrategica'
import type { MalhaEstrategica } from '@/lib/types'
import Modal from '@/components/ui/Modal'

const MARCAS = [
  { value: '',       label: 'Todas' },
  { value: 'volvo',  label: 'Volvo' },
  { value: 'daf',    label: 'DAF' },
  { value: 'scania', label: 'Scania' },
]

const POTENCIAIS_MIN = [
  { value: '',             label: 'Todos' },
  { value: 'alto',         label: 'Alto' },
  { value: 'medio',        label: 'Médio ou mais' },
  { value: 'baixo',        label: 'Qualquer' },
]

type Fonte = 'banco' | 'places' | 'manual'

interface RoteiroForm {
  marca: string
  cidade: string
  uf: string
  startPoint: string
  returnPoint: string
  dias: number
  fonte: Fonte
  listaManual: string
  potencialMin: string
  incluirNaoVisitados: boolean
}

const EMPTY: RoteiroForm = {
  marca: '',
  cidade: '',
  uf: '',
  startPoint: '',
  returnPoint: '',
  dias: 1,
  fonte: 'manual',
  listaManual: '',
  potencialMin: '',
  incluirNaoVisitados: true,
}

const MARCA_BADGE: Record<string, string> = {
  volvo:  'bg-[#1A3A6B]',
  scania: 'bg-[#D97706]',
  daf:    'bg-[#166534]',
}

export default function RoteiroPage() {
  const [form, setForm] = useState<RoteiroForm>(EMPTY)
  const [resultado, setResultado] = useState<RoteirizarResult | null>(null)
  const [showLista, setShowLista] = useState(false)
  const [showMalha, setShowMalha] = useState(false)
  const [buscandoInsta, setBuscandoInsta] = useState(false)
  const [mesMalha, setMesMalha] = useState(() => MESES_PT[new Date().getMonth()])
  const gerarRoteiro = useGerarRoteiro()
  const { data: malhaData } = useMalhaEstrategica()

  const mesesDisp = useMemo(() => {
    if (!malhaData?.length) return []
    return [...new Set(malhaData.map(e => e.mes))]
      .sort((a, b) => MESES_PT.indexOf(a) - MESES_PT.indexOf(b))
  }, [malhaData])

  const entriesMes = useMemo(() =>
    (malhaData ?? []).filter(e => e.mes === mesMalha),
    [malhaData, mesMalha]
  )

  function set<K extends keyof RoteiroForm>(field: K, value: RoteiroForm[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleCarregarMalha(entry: MalhaEstrategica) {
    const [cidadeRaw, ufRaw] = entry.cidade_base.split('/')
    setForm(prev => ({
      ...prev,
      marca: entry.marca.toLowerCase(),
      cidade: cidadeRaw.trim(),
      uf: (ufRaw ?? '').trim(),
    }))
    setShowMalha(false)
    toast.success(`Região carregada: ${entry.cidade_base}${entry.regiao_estrategica ? ` — ${entry.regiao_estrategica}` : ''}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.startPoint.trim()) {
      toast.error('Informe o ponto de partida.')
      return
    }
    if (form.fonte === 'manual' && !form.listaManual.trim()) {
      toast.error('Cole a lista de oficinas antes de gerar.')
      return
    }
    if (form.fonte !== 'manual' && !form.cidade.trim()) {
      toast.error('Informe a cidade para buscar no banco.')
      return
    }

    const regiao = [form.cidade, form.uf].filter(Boolean).join(' ') || 'Região'

    try {
      const result = await gerarRoteiro.mutateAsync({
        fonte: form.fonte,
        start_point: form.startPoint.trim(),
        regiao,
        cidade: form.cidade.trim() || undefined,
        uf: form.uf || undefined,
        marca: form.marca || undefined,
        potencial_min: form.potencialMin || undefined,
        incluir_nao_visitados: form.incluirNaoVisitados,
        leads: form.fonte === 'manual' ? parseLeadsFromText(form.listaManual) : undefined,
        dias: form.dias > 1 ? form.dias : undefined,
        return_point: form.returnPoint.trim() || undefined,
      })
      setResultado(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar roteiro')
    }
  }

  async function handleBuscarInstagram() {
    setBuscandoInsta(true)
    try {
      const resp = await fetch('https://n8n.ayalaoficial.com.br/webhook/instagram-oficinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cidade: form.cidade.trim(),
          uf: form.uf,
          hashtags: ['oficinacaminhao', 'mecanicadiesel', 'eletricadiesel', 'truckcenter', 'dieselpesado'],
        }),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      if (data.status === 'iniciado') {
        toast.success('Busca iniciada! Novas oficinas aparecerão em Prospectos em ~10 minutos.')
      } else {
        const criados: number = data.criados ?? 0
        const duplicatas: number = data.duplicatas ?? 0
        if (criados > 0) {
          toast.success(`${criados} nova${criados !== 1 ? 's' : ''} oficina${criados !== 1 ? 's' : ''} adicionada${criados !== 1 ? 's' : ''} ao banco!${duplicatas > 0 ? ` (${duplicatas} duplicata${duplicatas !== 1 ? 's' : ''} ignorada${duplicatas !== 1 ? 's' : ''})` : ''}`)
        } else {
          toast('Nenhuma oficina nova encontrada no Instagram para esta cidade.')
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao buscar no Instagram')
    } finally {
      setBuscandoInsta(false)
    }
  }

  return (
    <div className="h-full md:ml-56 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Navigation size={20} className="text-orange" />
            <h1 className="font-display font-bold text-navy text-lg">Gerar Roteiro</h1>
          </div>
          <p className="text-muted text-xs">
            Otimiza a sequência de visitas por malha viária real — Google Directions API
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* MALHA ESTRATÉGICA */}
          {malhaData && malhaData.length > 0 && (
            <div className="section-card overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMalha(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-orange" />
                  <span className="font-display font-bold text-navy text-sm">Malha estratégica</span>
                  <span className="text-[11px] text-muted hidden sm:inline">— carregar planejamento mensal</span>
                </div>
                <ChevronDown
                  size={15}
                  className={`text-muted transition-transform duration-200 ${showMalha ? 'rotate-180' : ''}`}
                />
              </button>

              {showMalha && (
                <div className="border-t border-slate-200 px-4 py-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="field-label shrink-0 mb-0">Mês</label>
                    <select
                      value={mesMalha}
                      onChange={e => setMesMalha(e.target.value)}
                      className="input-field"
                    >
                      {mesesDisp.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {entriesMes.length === 0 ? (
                    <p className="text-xs text-muted italic">Nenhuma entrada planejada para {mesMalha}.</p>
                  ) : (
                    <div className="space-y-2">
                      {entriesMes.map(entry => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => handleCarregarMalha(entry)}
                          className="w-full flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 hover:border-orange/50 hover:bg-orange/5 transition-colors cursor-pointer text-left"
                        >
                          <span className={`${MARCA_BADGE[entry.marca.toLowerCase()] ?? 'bg-slate-600'} text-white text-[10px] font-display font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-wide`}>
                            {entry.marca}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-display font-semibold text-navy">{entry.cidade_base}</p>
                            {entry.regiao_estrategica && (
                              <p className="text-[11px] text-muted">{entry.regiao_estrategica}</p>
                            )}
                          </div>
                          <ChevronDown size={13} className="text-muted shrink-0 -rotate-90" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* REGIÃO */}
          <div className="section-card p-4">
            <h3 className="font-display font-bold text-xs text-slate-600 uppercase tracking-wide mb-3">Região</h3>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade">
                <input
                  type="text"
                  value={form.cidade}
                  onChange={(e) => set('cidade', e.target.value)}
                  placeholder="Joinville"
                  className="input-field"
                />
              </Field>
              <Field label="UF">
                <select value={form.uf} onChange={(e) => set('uf', e.target.value)} className="input-field">
                  <option value="">UF</option>
                  {UF_OPTIONS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Ponto de partida" className="mt-3">
              <input
                type="text"
                value={form.startPoint}
                onChange={(e) => set('startPoint', e.target.value)}
                placeholder="Ex: Hotel Ibis, Rua XV de Novembro 123, Joinville SC"
                className="input-field"
              />
            </Field>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <Field label="Dividir em dias">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => set('dias', Math.max(1, form.dias - 1))}
                    className="w-8 h-[42px] flex items-center justify-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-navy font-bold hover:bg-slate-100 transition-colors cursor-pointer text-lg leading-none"
                  >−</button>
                  <span className="flex-1 h-[42px] flex items-center justify-center border border-slate-300 bg-white font-display font-bold text-navy text-sm">
                    {form.dias}
                  </span>
                  <button
                    type="button"
                    onClick={() => set('dias', Math.min(7, form.dias + 1))}
                    className="w-8 h-[42px] flex items-center justify-center rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 text-navy font-bold hover:bg-slate-100 transition-colors cursor-pointer text-lg leading-none"
                  >+</button>
                </div>
              </Field>
              <Field label="Local de retorno / fim do dia" className="col-span-2">
                <input
                  type="text"
                  value={form.returnPoint}
                  onChange={(e) => set('returnPoint', e.target.value)}
                  placeholder="Vazio = retorna ao ponto de partida"
                  className="input-field"
                />
              </Field>
            </div>

            <Field label="Marca de interesse" className="mt-3">
              <div className="flex gap-2">
                {MARCAS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => set('marca', m.value)}
                    className={`flex-1 rounded-lg text-xs font-display font-bold py-2.5 transition-colors cursor-pointer border ${
                      form.marca === m.value
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-slate-300 bg-slate-50 text-navy hover:border-orange/50 hover:bg-orange/5'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </Field>

            {form.cidade.trim() && (
              <button
                type="button"
                onClick={handleBuscarInstagram}
                disabled={buscandoInsta}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-pink-200 bg-pink-50 text-pink-700 text-xs font-display font-semibold py-2.5 hover:bg-pink-100 transition-colors cursor-pointer disabled:opacity-60"
              >
                {buscandoInsta ? (
                  <div className="w-3.5 h-3.5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <AtSign size={14} />
                )}
                {buscandoInsta ? 'Buscando no Instagram...' : 'Buscar no Instagram desta cidade'}
              </button>
            )}
          </div>

          {/* FONTE */}
          <div className="section-card p-4">
            <h3 className="font-display font-bold text-xs text-slate-600 uppercase tracking-wide mb-3">Fonte das oficinas</h3>

            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'manual',  label: 'Colar lista',    desc: 'Cola endereços' },
                { value: 'banco',   label: 'Do banco',       desc: 'Prospectos CRM' },
                { value: 'places',  label: 'Google Places',  desc: 'Descoberta ativa' },
              ] as { value: Fonte; label: string; desc: string }[]).map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => set('fonte', f.value)}
                  className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                    form.fonte === f.value
                      ? 'border-orange bg-orange/10'
                      : 'border-slate-300 bg-slate-50 hover:border-orange/40'
                  }`}
                >
                  <p className={`text-xs font-display font-bold ${form.fonte === f.value ? 'text-orange' : 'text-navy'}`}>
                    {f.label}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">{f.desc}</p>
                </button>
              ))}
            </div>

            {/* Lista manual */}
            {form.fonte === 'manual' && (
              <div className="mt-3">
                <Field label="Lista de oficinas (uma por linha)">
                  <textarea
                    value={form.listaManual}
                    onChange={(e) => set('listaManual', e.target.value)}
                    placeholder={`Nome da oficina — Rua Industrial 100, Joinville SC\nEletro Truck — Av. Santos Dumont 500, Joinville SC\nRua das Palmeiras 30, Joinville SC`}
                    rows={8}
                    className="input-field resize-none font-mono text-xs"
                  />
                </Field>
                <p className="text-[11px] text-muted mt-1.5">
                  Formato: <code className="bg-slate-100 px-1 rounded">Nome — Endereço completo</code> ou só o endereço. Um por linha.
                </p>
                {form.listaManual.trim() && (
                  <p className="text-[11px] text-orange mt-1">
                    {parseLeadsFromText(form.listaManual).length} oficinas detectadas
                  </p>
                )}
              </div>
            )}

            {/* Filtros banco/places */}
            {(form.fonte === 'banco' || form.fonte === 'places') && (
              <div className="mt-3 space-y-3">
                {form.fonte === 'banco' && (
                  <>
                    <Field label="Potencial mínimo">
                      <select value={form.potencialMin} onChange={(e) => set('potencialMin', e.target.value)} className="input-field">
                        {POTENCIAIS_MIN.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </Field>
                    <div className="flex items-center gap-3 h-11 px-3 bg-white border border-slate-300 rounded-lg">
                      <input
                        type="checkbox"
                        id="incluir_nao_visitados"
                        checked={form.incluirNaoVisitados}
                        onChange={(e) => set('incluirNaoVisitados', e.target.checked)}
                        className="w-4 h-4 accent-orange cursor-pointer"
                      />
                      <label htmlFor="incluir_nao_visitados" className="text-sm font-display font-semibold text-navy cursor-pointer">
                        Incluir não visitados
                      </label>
                    </div>
                  </>
                )}
                {form.fonte === 'places' && (
                  <div className="flex items-start gap-2 bg-orange/5 border border-orange/20 rounded-lg p-3">
                    <AlertCircle size={14} className="text-orange shrink-0 mt-0.5" />
                    <p className="text-xs text-orange">
                      Requer o workflow <strong>Roteiro-Visitas-Integrado</strong> ativo no n8n (Fase 2). Faça o test com "Do banco" ou "Colar lista" enquanto isso.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={gerarRoteiro.isPending}
            className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
          >
            {gerarRoteiro.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Otimizando rota...
              </>
            ) : (
              <>
                <Route size={18} />
                Gerar Roteiro
              </>
            )}
          </button>
        </form>

        {/* RESULTADO */}
        {resultado && (
          <div className="mt-6 space-y-4">
            <div className="section-card p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="font-display font-bold text-navy text-base">
                    {resultado.regiao ? `Roteiro — ${resultado.regiao}` : 'Roteiro gerado'}
                  </h2>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {resultado.total_leads} oficinas
                    </span>
                    {(resultado.total_dias ?? 1) > 1 && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {resultado.total_dias} dias
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Route size={12} />
                      ~{resultado.distancia_km} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      ~{resultado.tempo_estimado}
                    </span>
                  </div>
                  {resultado.retorno && resultado.retorno !== resultado.partida && (
                    <p className="text-[11px] text-muted mt-1">
                      🏁 Retorno: {resultado.retorno}
                    </p>
                  )}
                </div>
                <CopyButton text={resultado.mensagem_whatsapp} label="Copiar tudo (WhatsApp)" />
              </div>
            </div>

            {/* Multi-dia: agrupa por dia */}
            {(resultado.total_dias ?? 1) > 1 && resultado.dias
              ? resultado.dias.map((d) => (
                  <DiaSection key={d.dia} dia={d} />
                ))
              : resultado.rotas.map((rota) => (
                  <RotaCard key={rota.rota} rota={rota} />
                ))
            }

            {/* LISTA PARA CAMPO */}
            <ListaCampo
              rotas={resultado.rotas}
              open={showLista}
              onToggle={() => setShowLista(v => !v)}
            />
          </div>
        )}

        <MalhaGerenciar />
      </div>
    </div>
  )
}

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

function DiaSection({ dia }: { dia: DiaDado }) {
  const [open, setOpen] = useState(true)

  const msgDia = useMemo(() => {
    const rotasBloco = dia.rotas.map(r => {
      const lista = r.paradas.map(p => `    ${p.seq}. ${p.nome}`).join('\n')
      return `  *Rota ${r.rota} (paradas ${r.de}–${r.ate}):*\n${lista}\n  👉 ${r.url}`
    }).join('\n\n')
    return `*📅 DIA ${dia.dia}${DIAS_SEMANA[dia.dia - 1] ? ` — ${DIAS_SEMANA[dia.dia - 1]}` : ''} (${dia.total_paradas} oficinas)*\n${rotasBloco}`
  }, [dia])

  return (
    <div className="section-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-orange" />
          <span className="font-display font-bold text-navy text-sm">
            Dia {dia.dia}
            {DIAS_SEMANA[dia.dia - 1] && (
              <span className="text-muted font-normal ml-1">· {DIAS_SEMANA[dia.dia - 1]}</span>
            )}
          </span>
          <span className="bg-orange/10 text-orange text-[10px] font-display font-bold px-2 py-0.5 rounded-full">
            {dia.total_paradas} oficinas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={msgDia} label="Copiar dia" small />
          <ChevronDown size={16} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {dia.rotas.map((rota) => (
            <RotaCard key={rota.rota} rota={rota} />
          ))}
        </div>
      )}
    </div>
  )
}

function RotaCard({ rota }: { rota: Rota }) {
  return (
    <div className="section-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="font-display font-bold text-navy text-sm">
            Rota {rota.rota}
            <span className="text-muted font-normal ml-1">· paradas {rota.de}–{rota.ate}</span>
          </h3>
        </div>
        <div className="flex gap-2 shrink-0">
          <CopyButton text={rota.url} label="Copiar link" small />
          <a
            href={rota.url}
            target="_blank"
            rel="noreferrer"
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            <ExternalLink size={13} />
            Abrir no Maps
          </a>
        </div>
      </div>

      <ol className="space-y-1">
        {rota.paradas.map((p) => (
          <li key={p.seq} className="flex items-start gap-2 text-xs">
            <span className="w-5 h-5 rounded-full bg-orange/10 border border-orange/30 text-orange font-display font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
              {p.seq}
            </span>
            <div className="min-w-0">
              <p className="font-display font-semibold text-navy truncate">{p.nome}</p>
              <p className="text-muted truncate">{p.endereco}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function CopyButton({ text, label, small }: { text: string; label: string; small?: boolean }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Erro ao copiar')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-secondary flex items-center gap-1.5 ${small ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'}`}
    >
      {copied ? <Check size={small ? 12 : 14} /> : <Copy size={small ? 12 : 14} />}
      {copied ? 'Copiado!' : label}
    </button>
  )
}

function shortAddr(addr: string): string {
  return addr
    .replace(/,?\s*Brasil$/i, '')
    .replace(/,?\s*BR$/i, '')
    .split(',')
    .slice(0, 2)
    .join(',')
    .trim()
}

function toWaLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const number = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${number}`
}

function fmtPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return phone
}

function ListaCampo({ rotas, open, onToggle }: { rotas: Rota[]; open: boolean; onToggle: () => void }) {
  const todasParadas = useMemo(() => rotas.flatMap(r => r.paradas), [rotas])

  const textoParaCopiar = useMemo(() =>
    todasParadas.map(p => {
      const parts = [p.nome, shortAddr(p.endereco)]
      if (p.telefone_oficina) parts.push(fmtPhone(p.telefone_oficina))
      if (p.nome_responsavel || p.whatsapp_responsavel) {
        const contato = [p.nome_responsavel, p.whatsapp_responsavel ? fmtPhone(p.whatsapp_responsavel) : '']
          .filter(Boolean).join(' / ')
        parts.push(contato)
      }
      return `${p.seq}. ${parts.join(' — ')}`
    }).join('\n'),
    [todasParadas]
  )

  return (
    <div className="section-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <List size={15} className="text-orange" />
          <span className="font-display font-bold text-navy text-sm">Lista para campo</span>
          <span className="text-[11px] text-muted">— copiar e colar no Maps / Waze</span>
        </div>
        <span className="text-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-200">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
            <span className="text-[11px] text-muted">{todasParadas.length} paradas</span>
            <CopyButton text={textoParaCopiar} label="Copiar lista" small />
          </div>

          <ol className="divide-y divide-slate-100">
            {todasParadas.map((p) => (
              <li key={p.seq} className="flex items-start gap-3 px-4 py-2.5">
                <span className="w-5 h-5 rounded-full bg-orange/10 border border-orange/30 text-orange font-display font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  {p.seq}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold text-navy text-xs leading-tight">{p.nome}</p>
                  <p className="text-muted text-[11px] mt-0.5 truncate">{shortAddr(p.endereco)}</p>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                    {p.telefone_oficina && (
                      <a
                        href={`tel:${p.telefone_oficina.replace(/\D/g, '')}`}
                        className="text-[11px] text-slate-600 hover:text-navy flex items-center gap-1"
                      >
                        ☎ {fmtPhone(p.telefone_oficina)}
                      </a>
                    )}
                    {p.whatsapp_responsavel && (
                      <a
                        href={toWaLink(p.whatsapp_responsavel)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-600 font-medium"
                      >
                        <MessageCircle size={11} />
                        {p.nome_responsavel
                          ? `${p.nome_responsavel} · ${fmtPhone(p.whatsapp_responsavel)}`
                          : fmtPhone(p.whatsapp_responsavel)}
                      </a>
                    )}
                    {!p.telefone_oficina && !p.whatsapp_responsavel && (
                      <span className="text-[11px] text-slate-400 italic">sem contato</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

// ─── Gerenciar Malha Estratégica ─────────────────────────────────────────────

const MARCAS_MALHA = ['Volvo', 'Scania', 'DAF']

type MalhaPayload = Omit<MalhaEstrategica, 'id'>

const EMPTY_MALHA: MalhaPayload = {
  mes: MESES_PT[new Date().getMonth()],
  marca: 'Volvo',
  cidade_base: '',
  regiao_estrategica: null,
  cidades_visitacao: null,
  objetivo: null,
  observacoes: null,
}

function MalhaGerenciar() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MalhaEstrategica | 'new' | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: malha = [], isLoading } = useMalhaEstrategica()
  const createMalha = useCreateMalha()
  const updateMalha = useUpdateMalha()
  const deleteMalha = useDeleteMalha()

  const porMes = MESES_PT.reduce<Record<string, MalhaEstrategica[]>>((acc, mes) => {
    const entries = malha.filter(m => m.mes === mes)
    if (entries.length > 0) acc[mes] = entries
    return acc
  }, {})

  async function handleSave(data: MalhaPayload) {
    try {
      if (editing === 'new') {
        await createMalha.mutateAsync(data)
        toast.success('Entrada adicionada')
      } else if (editing) {
        await updateMalha.mutateAsync({ ...data, id: editing.id })
        toast.success('Entrada atualizada')
      }
      setEditing(null)
    } catch {
      toast.error('Erro ao salvar')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMalha.mutateAsync(id)
      toast.success('Entrada removida')
      setConfirmId(null)
    } catch {
      toast.error('Erro ao remover')
    }
  }

  return (
    <div className="mt-6 section-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Map size={15} className="text-orange" />
          <span className="font-display font-bold text-navy text-sm">Gerenciar Malha Estratégica</span>
        </div>
        <ChevronDown size={15} className={`text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-200">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
            <span className="text-xs text-muted">{malha.length} entrada{malha.length !== 1 ? 's' : ''} planejadas</span>
            <button
              type="button"
              onClick={() => setEditing('new')}
              className="flex items-center gap-1.5 text-xs btn-secondary px-3 py-1.5"
            >
              <Plus size={12} /> Adicionar
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : Object.keys(porMes).length === 0 ? (
            <p className="text-center py-8 text-muted text-sm">Nenhuma entrada cadastrada.</p>
          ) : (
            Object.entries(porMes).map(([mes, entries]) => (
              <div key={mes}>
                <div className="px-4 py-2 bg-slate-50/70 border-y border-slate-100">
                  <span className="text-xs font-display font-bold text-slate-600 uppercase tracking-wide">{mes}</span>
                  <span className="text-xs text-muted ml-2">{entries.length} entrada{entries.length !== 1 ? 's' : ''}</span>
                </div>
                {entries.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0">
                    <span className={`${MARCA_BADGE[entry.marca.toLowerCase()] ?? 'bg-slate-600'} text-white text-[10px] font-display font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-wide`}>
                      {entry.marca}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-display font-semibold text-navy">{entry.cidade_base}</p>
                      {entry.regiao_estrategica && (
                        <p className="text-[11px] text-muted">{entry.regiao_estrategica}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditing(entry)}
                        className="p-1.5 rounded hover:bg-slate-100 text-muted hover:text-navy transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(entry.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-muted hover:text-red-600 transition-colors cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      <MalhaModal
        entry={editing !== 'new' ? editing : null}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        isPending={createMalha.isPending || updateMalha.isPending}
      />

      {confirmId && (
        <div
          className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center"
          onClick={() => setConfirmId(null)}
        >
          <div className="bg-white rounded-xl shadow-xl p-5 max-w-xs mx-4" onClick={e => e.stopPropagation()}>
            <p className="font-display font-bold text-navy text-sm mb-2">Remover entrada?</p>
            <p className="text-xs text-muted mb-4">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="flex-1 btn-secondary text-sm py-2 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmId)}
                disabled={deleteMalha.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg font-display font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                {deleteMalha.isPending ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MalhaModal({ entry, open, onClose, onSave, isPending }: {
  entry: MalhaEstrategica | null
  open: boolean
  onClose: () => void
  onSave: (data: MalhaPayload) => Promise<void>
  isPending: boolean
}) {
  const [form, setForm] = useState<MalhaPayload>(EMPTY_MALHA)

  useEffect(() => {
    if (open) {
      setForm(entry ? {
        mes: entry.mes,
        marca: entry.marca,
        cidade_base: entry.cidade_base,
        regiao_estrategica: entry.regiao_estrategica,
        cidades_visitacao: entry.cidades_visitacao,
        objetivo: entry.objetivo,
        observacoes: entry.observacoes,
      } : { ...EMPTY_MALHA, mes: MESES_PT[new Date().getMonth()] })
    }
  }, [open, entry])

  function setF<K extends keyof MalhaPayload>(field: K, value: MalhaPayload[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.cidade_base.trim()) {
      toast.error('Informe a cidade-base (ex: Joinville/SC)')
      return
    }
    await onSave(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'Editar Entrada' : 'Nova Entrada'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Mês</label>
            <select value={form.mes} onChange={e => setF('mes', e.target.value)} className="input-field">
              {MESES_PT.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Marca</label>
            <select value={form.marca} onChange={e => setF('marca', e.target.value)} className="input-field">
              {MARCAS_MALHA.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="field-label">
            Cidade-base <span className="text-muted font-normal">(Cidade/UF)</span>
          </label>
          <input
            type="text"
            value={form.cidade_base}
            onChange={e => setF('cidade_base', e.target.value)}
            placeholder="Joinville/SC"
            className="input-field"
          />
        </div>

        <div>
          <label className="field-label">
            Região estratégica <span className="text-muted font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.regiao_estrategica ?? ''}
            onChange={e => setF('regiao_estrategica', e.target.value || null)}
            placeholder="Grande Florianópolis"
            className="input-field"
          />
        </div>

        <div>
          <label className="field-label">
            Cidades de visitação <span className="text-muted font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.cidades_visitacao ?? ''}
            onChange={e => setF('cidades_visitacao', e.target.value || null)}
            placeholder="Blumenau, Gaspar, Brusque"
            className="input-field"
          />
        </div>

        <div>
          <label className="field-label">
            Objetivo <span className="text-muted font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.objetivo ?? ''}
            onChange={e => setF('objetivo', e.target.value || null)}
            placeholder="Expandir base DAF na região sul"
            className="input-field"
          />
        </div>

        <div>
          <label className="field-label">
            Observações <span className="text-muted font-normal">(opcional)</span>
          </label>
          <textarea
            value={form.observacoes ?? ''}
            onChange={e => setF('observacoes', e.target.value || null)}
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary py-2.5 text-sm cursor-pointer">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isPending
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvando...</>
              : 'Salvar'
            }
          </button>
        </div>
      </form>
    </Modal>
  )
}
