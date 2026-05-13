import { useState } from 'react'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/dexie'
import { toE164 } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'

const MARCAS = ['Volvo', 'DAF', 'Scania'] as const

const TIPOS_OFICINA = [
  { value: 'mecanica_movel',  label: 'Mecânica Móvel' },
  { value: 'mecatronica',     label: 'Mecatrônica' },
  { value: 'transportadora',  label: 'Transportadora' },
  { value: 'eletrica_diesel', label: 'Elétrica Diesel' },
  { value: 'mecanica_diesel', label: 'Mecânica Diesel' },
  { value: 'diesel_sos',      label: 'Diesel SOS' },
  { value: 'eletro_mecanica', label: 'Eletro-Mecânica' },
] as const

const POTENCIAIS = [
  { value: 'alto',          label: 'Alto' },
  { value: 'medio',         label: 'Médio' },
  { value: 'baixo',         label: 'Baixo' },
  { value: 'sem_interesse', label: 'Sem Interesse' },
] as const

const PERFIS = [
  { value: 'individual', label: 'Individual' },
  { value: 'grupo_b2b',  label: 'Grupo B2B' },
] as const

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

interface VisitaForm {
  empresa_oficina: string
  tipo_oficina: string
  multimarcas: boolean
  especializacao_oficina: string
  qtd_interessados: string
  nome: string
  telefone: string
  cidade: string
  uf: string
  marcas: string[]
  perfil: string
  potencial: string
  resultado_visita: string
  proximo_passo: string
  data_retorno: string
  consultor: string
  observacoes: string
}

const EMPTY: VisitaForm = {
  empresa_oficina: '', tipo_oficina: '', multimarcas: false,
  especializacao_oficina: '', qtd_interessados: '',
  nome: '', telefone: '', cidade: '', uf: '',
  marcas: [], perfil: '', potencial: '',
  resultado_visita: '', proximo_passo: '', data_retorno: '',
  consultor: '', observacoes: '',
}

export default function VisitaPage() {
  const [form, setForm] = useState<VisitaForm>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const { isOnline } = useOfflineSync()

  function set<K extends keyof VisitaForm>(field: K, value: VisitaForm[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleMarca(m: string) {
    setForm(prev => ({
      ...prev,
      marcas: prev.marcas.includes(m)
        ? prev.marcas.filter(x => x !== m)
        : [...prev.marcas, m],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload: Record<string, unknown> = {
      empresa_oficina:           form.empresa_oficina.trim() || null,
      nome_responsavel_treinamento: form.nome.trim() || null,
      whatsapp_responsavel:      toE164(form.telefone) || null,
      cidade:                    form.cidade.trim() || null,
      uf:                        form.uf || null,
      tipo_oficina:              form.tipo_oficina || null,
      marca_interesse:           form.marcas.length ? form.marcas.join(',').toLowerCase() : null,
      potencial:                 form.potencial || null,
      perfil:                    form.perfil || null,
      multimarcas:               form.multimarcas,
      especializacao_oficina:    form.especializacao_oficina.trim() || null,
      qtd_interessados:          form.qtd_interessados || null,
      resultado_visita:          form.resultado_visita.trim() || null,
      proximo_passo:             form.proximo_passo.trim() || null,
      data_retorno:              form.data_retorno || null,
      consultor:                 form.consultor.trim() || null,
      observacoes:               form.observacoes.trim() || null,
      canal_origem:              'visita',
      data_visita:               new Date().toISOString().split('T')[0],
    }

    try {
      if (isOnline) {
        const { error } = await supabase
          .from('cadastro_prospectos')
          .upsert(payload, { onConflict: 'whatsapp_responsavel', ignoreDuplicates: false })
        if (error) throw error
        toast.success('Visita registrada com sucesso!')
      } else {
        await db.pendentes.add({
          tempId: `visita_${Date.now()}`,
          payload,
          createdAt: new Date().toISOString(),
          syncStatus: 'pendente',
        })
        toast('Visita salva offline. Será enviada ao reconectar.', { duration: 5000 })
      }
      setForm(EMPTY)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full md:ml-56 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-white text-lg">Registrar Visita</h1>
            <p className="text-muted text-xs mt-0.5">
              {isOnline ? 'Online — envio imediato' : 'Offline — salvo localmente'}
            </p>
          </div>
          {!isOnline && (
            <span className="text-xs bg-orange/20 text-orange border border-orange/40 px-2 py-1 rounded-full font-display font-semibold">
              Offline
            </span>
          )}
        </div>

        {saved && (
          <div className="flex items-center gap-2 bg-green-100 border border-green-300 rounded-xl p-3 mb-4">
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            <p className="text-green-700 text-sm font-display font-semibold">Visita registrada!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SEÇÃO 1 — DADOS DA OFICINA */}
          <Section title="Dados da Oficina">
            <Field label="Nome da oficina">
              <input
                type="text"
                value={form.empresa_oficina}
                onChange={(e) => set('empresa_oficina', e.target.value)}
                placeholder="Ex: Oficina Silva e Filhos"
                className="input-field"
              />
            </Field>

            <Field label="Tipo de oficina" className="mt-3">
              <select
                value={form.tipo_oficina}
                onChange={(e) => set('tipo_oficina', e.target.value)}
                className="input-field"
              >
                <option value="">Selecione</option>
                {TIPOS_OFICINA.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>

            <div className="flex items-center gap-3 mt-3 h-12 px-3 bg-white/5 border border-white/20 rounded-lg">
              <input
                type="checkbox"
                id="multimarcas"
                checked={form.multimarcas}
                onChange={(e) => set('multimarcas', e.target.checked)}
                className="w-4 h-4 accent-orange cursor-pointer"
              />
              <label htmlFor="multimarcas" className="text-sm font-display font-semibold text-white cursor-pointer">
                Multimarcas
              </label>
            </div>

            <Field label="Especialização da oficina" className="mt-3">
              <input
                type="text"
                value={form.especializacao_oficina}
                onChange={(e) => set('especializacao_oficina', e.target.value)}
                placeholder="Ex: Especializado Mercedes"
                className="input-field"
              />
            </Field>

            <Field label="Qtd. interessados" className="mt-3">
              <input
                type="number"
                value={form.qtd_interessados}
                onChange={(e) => set('qtd_interessados', e.target.value)}
                placeholder="0"
                min="0"
                className="input-field"
              />
            </Field>
          </Section>

          {/* SEÇÃO 2 — CONTATO */}
          <Section title="Contato">
            <Field label="Nome do responsável">
              <input
                type="text"
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                placeholder="Nome do contato"
                className="input-field"
              />
            </Field>

            <Field label="Telefone / WhatsApp" className="mt-3">
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => set('telefone', e.target.value)}
                placeholder="(47) 99999-9999"
                className="input-field"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3 mt-3">
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
                <select
                  value={form.uf}
                  onChange={(e) => set('uf', e.target.value)}
                  className="input-field"
                >
                  <option value="">UF</option>
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          {/* SEÇÃO 3 — INTERESSE */}
          <Section title="Interesse">
            <Field label="Marca de interesse">
              <div className="flex gap-2">
                {MARCAS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMarca(m)}
                    className={`flex-1 rounded-lg text-sm font-display font-bold transition-colors cursor-pointer border min-h-[48px] ${
                      form.marcas.includes(m)
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-white/20 bg-transparent text-muted hover:border-orange/50 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Tipo do lead" className="mt-3">
              <div className="flex gap-2">
                {PERFIS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set('perfil', form.perfil === p.value ? '' : p.value)}
                    className={`flex-1 rounded-lg text-sm font-display font-bold transition-colors cursor-pointer border min-h-[48px] ${
                      form.perfil === p.value
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-white/20 bg-transparent text-muted hover:border-orange/50 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Potencial" className="mt-3">
              <div className="flex gap-2">
                {POTENCIAIS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set('potencial', form.potencial === p.value ? '' : p.value)}
                    className={`flex-1 rounded-lg text-xs font-display font-bold transition-colors cursor-pointer border min-h-[48px] ${
                      form.potencial === p.value
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-white/20 bg-transparent text-muted hover:border-orange/50 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          {/* SEÇÃO 4 — DETALHES */}
          <Section title="Detalhes (opcional)">
            <Field label="Resultado da visita">
              <textarea
                value={form.resultado_visita}
                onChange={(e) => set('resultado_visita', e.target.value)}
                placeholder="Ex: Muito interesse, pediu proposta"
                rows={3}
                className="input-field resize-none"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Próximo passo">
                <input
                  type="text"
                  value={form.proximo_passo}
                  onChange={(e) => set('proximo_passo', e.target.value)}
                  placeholder="Ex: Ligar em 3 dias"
                  className="input-field"
                />
              </Field>
              <Field label="Data de retorno">
                <input
                  type="date"
                  value={form.data_retorno}
                  onChange={(e) => set('data_retorno', e.target.value)}
                  className="input-field"
                />
              </Field>
            </div>

            <Field label="Consultor" className="mt-3">
              <input
                type="text"
                value={form.consultor}
                onChange={(e) => set('consultor', e.target.value)}
                placeholder="Nome do consultor"
                className="input-field"
              />
            </Field>

            <Field label="Observações" className="mt-3">
              <textarea
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                placeholder="Anotações livres..."
                rows={3}
                className="input-field resize-none"
              />
            </Field>
          </Section>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base"
          >
            {loading ? 'Salvando...' : isOnline ? 'Registrar Visita' : 'Salvar Offline'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section-card p-4">
      <h3 className="font-display font-bold text-xs text-muted uppercase tracking-wide mb-3">{title}</h3>
      {children}
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
