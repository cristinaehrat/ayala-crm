import { useState } from 'react'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/dexie'
import { toE164 } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'

const MARCAS = ['Volvo', 'DAF', 'Scania'] as const
const POTENCIAIS = ['Individual', 'Grupo', 'Sem interesse'] as const
const TIPOS_OFICINA = ['Mecânica', 'Elétrica', 'Auto Center', 'Frota', 'Outra'] as const
const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

interface VisitaForm {
  empresa_oficina: string
  nome: string
  telefone: string
  cidade: string
  uf: string
  marca_interesse: string
  potencial: string
  tipo_oficina: string
  qtd_interessados: string
  resultado_visita: string
  proximo_passo: string
  data_retorno: string
  observacoes: string
  consultor: string
}

const EMPTY: VisitaForm = {
  empresa_oficina: '', nome: '', telefone: '', cidade: '', uf: '',
  marca_interesse: '', potencial: '', tipo_oficina: '', qtd_interessados: '',
  resultado_visita: '', proximo_passo: '', data_retorno: '', observacoes: '', consultor: '',
}

export default function VisitaPage() {
  const [form, setForm] = useState<VisitaForm>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const { isOnline } = useOfflineSync()

  const set = (field: keyof VisitaForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const isValid =
    form.empresa_oficina.trim() &&
    form.nome.trim() &&
    form.telefone.trim() &&
    form.cidade.trim() &&
    form.uf &&
    form.marca_interesse &&
    form.potencial

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)

    const payload: Record<string, unknown> = {
      empresa_oficina: form.empresa_oficina.trim(),
      nome: form.nome.trim(),
      telefone: toE164(form.telefone),
      cidade: form.cidade.trim(),
      uf: form.uf,
      marca_interesse: form.marca_interesse,
      potencial: form.potencial,
      tipo_oficina: form.tipo_oficina || null,
      resultado_visita: form.resultado_visita || null,
      proximo_passo: form.proximo_passo || null,
      data_retorno: form.data_retorno || null,
      observacoes: form.observacoes || null,
      consultor: form.consultor || null,
      origem: 'visita',
      canal_origem: 'visita',
      status: 'qualificado',
      data_visita: new Date().toISOString().split('T')[0],
      data_entrada: new Date().toISOString(),
    }

    if (form.qtd_interessados) {
      payload.qtd_interessados = parseInt(form.qtd_interessados)
    }

    try {
      if (isOnline) {
        const { error } = await supabase.from('leads_v2').upsert(payload, {
          onConflict: 'telefone',
          ignoreDuplicates: false,
        })
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
          <div className="flex items-center gap-2 bg-green-900/40 border border-green-700/40 rounded-xl p-3 mb-4">
            <CheckCircle size={16} className="text-green-400 shrink-0" />
            <p className="text-green-400 text-sm font-display font-semibold">
              Visita registrada!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Obrigatórios */}
          <Section title="Dados da Oficina *">
            <Field label="Nome da oficina *">
              <input
                type="text"
                value={form.empresa_oficina}
                onChange={(e) => set('empresa_oficina', e.target.value)}
                placeholder="Ex: Oficina Silva e Filhos"
                className="input-field"
                required
              />
            </Field>
          </Section>

          <Section title="Contato *">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome *">
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  placeholder="Nome do contato"
                  className="input-field"
                  required
                />
              </Field>
              <Field label="Telefone *">
                <input
                  type="tel"
                  value={form.telefone}
                  onChange={(e) => set('telefone', e.target.value)}
                  placeholder="(47) 99999-9999"
                  className="input-field"
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Cidade *">
                <input
                  type="text"
                  value={form.cidade}
                  onChange={(e) => set('cidade', e.target.value)}
                  placeholder="Joinville"
                  className="input-field"
                  required
                />
              </Field>
              <Field label="UF *">
                <select
                  value={form.uf}
                  onChange={(e) => set('uf', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">UF</option>
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Interesse *">
            <Field label="Marca de interesse *">
              <div className="flex gap-2">
                {MARCAS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set('marca_interesse', m)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-display font-bold transition-colors cursor-pointer border ${
                      form.marca_interesse === m
                        ? 'border-orange text-white bg-orange'
                        : 'border-white/20 text-muted bg-transparent hover:border-orange/50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Potencial *" className="mt-3">
              <div className="flex gap-2">
                {POTENCIAIS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set('potencial', p)}
                    className={`flex-1 py-2 rounded-lg text-xs font-display font-semibold transition-colors cursor-pointer border ${
                      form.potencial === p
                        ? 'border-orange text-white bg-orange'
                        : 'border-white/20 text-muted bg-transparent hover:border-orange/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          {/* Opcionais */}
          <Section title="Detalhes (opcional)">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo de oficina">
                <select
                  value={form.tipo_oficina}
                  onChange={(e) => set('tipo_oficina', e.target.value)}
                  className="input-field"
                >
                  <option value="">Selecione</option>
                  {TIPOS_OFICINA.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Qtd. interessados">
                <input
                  type="number"
                  value={form.qtd_interessados}
                  onChange={(e) => set('qtd_interessados', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="input-field"
                />
              </Field>
            </div>

            <Field label="Resultado da visita" className="mt-3">
              <input
                type="text"
                value={form.resultado_visita}
                onChange={(e) => set('resultado_visita', e.target.value)}
                placeholder="Ex: Muito interesse, pediu proposta"
                className="input-field"
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
            disabled={!isValid || loading}
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
      <label className="block text-xs font-display font-semibold text-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}
