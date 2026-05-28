import { useState } from 'react'
import { Navigation, ExternalLink, Copy, Check, AlertCircle, MapPin, Clock, Route } from 'lucide-react'
import { toast } from 'sonner'
import { UF_OPTIONS } from '@/lib/utils'
import { useGerarRoteiro, parseLeadsFromText, type RoteirizarResult, type Rota } from '@/hooks/useGerarRoteiro'

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
  fonte: 'manual',
  listaManual: '',
  potencialMin: '',
  incluirNaoVisitados: true,
}

export default function RoteiroPage() {
  const [form, setForm] = useState<RoteiroForm>(EMPTY)
  const [resultado, setResultado] = useState<RoteirizarResult | null>(null)
  const gerarRoteiro = useGerarRoteiro()

  function set<K extends keyof RoteiroForm>(field: K, value: RoteiroForm[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
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
      })
      setResultado(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar roteiro')
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
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {resultado.total_leads} oficinas
                    </span>
                    <span className="flex items-center gap-1">
                      <Route size={12} />
                      ~{resultado.distancia_km} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      ~{resultado.tempo_estimado}
                    </span>
                  </div>
                </div>
                <CopyButton text={resultado.mensagem_whatsapp} label="Copiar para WhatsApp" />
              </div>
            </div>

            {resultado.rotas.map((rota) => (
              <RotaCard key={rota.rota} rota={rota} />
            ))}
          </div>
        )}
      </div>
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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}
