import { useState, useEffect, useRef } from 'react'
import Modal from '@/components/ui/Modal'
import { useUpdateInscrito, useCreateInscrito } from '@/hooks/useInscritos'
import { useLead } from '@/hooks/useLeads'
import { supabase } from '@/lib/supabase'
import type { Inscrito, Lead } from '@/lib/types'
import { toast } from 'sonner'
import { Upload, Loader2, Search, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  inscrito: Inscrito | null
  turmaId: string
  leadId?: string | null
}

const FLUXO_OPTS = [
  { value: 'link_whatsapp',      label: 'Link WhatsApp' },
  { value: 'boleto_parceiro',    label: 'Boleto Parceiro' },
  { value: 'maquina_presencial', label: 'Máquina Presencial' },
  { value: 'pix_direto',         label: 'PIX Direto' },
] as const

const CUSTODIA_OPTS = [
  { value: '',         label: '—' },
  { value: 'Ayala',   label: 'Ayala' },
  { value: 'Parceiro', label: 'Parceiro' },
]

const STATUS_OPTS = [
  { value: '',             label: '—' },
  { value: 'pago',         label: 'Pago' },
  { value: 'parcial',      label: 'Parcial' },
  { value: 'pendente',     label: 'Pendente' },
  { value: 'inadimplente', label: 'Inadimplente' },
]

type Form = {
  nome: string
  empresa_oficina: string
  valor_total: string
  valor_entrada: string
  saldo_a_receber: string
  status_financeiro: string
  custodia_entrada: string
  comprovante_validado: boolean
  cobrar_em_aula: boolean
  url_comprovante: string
  pagante_nome_nf: string
  pagante_documento: string
  pagante_email_nf: string
  observacoes_negociacao: string
}

function fromInscrito(i: Inscrito | null): Form {
  return {
    nome:                  i?.nome ?? '',
    empresa_oficina:       i?.empresa_oficina ?? '',
    valor_total:           String(i?.valor_total ?? ''),
    valor_entrada:         String(i?.valor_entrada ?? ''),
    saldo_a_receber:       String(i?.saldo_a_receber ?? ''),
    status_financeiro:     i?.status_financeiro ?? '',
    custodia_entrada:      i?.custodia_entrada ?? '',
    comprovante_validado:  i?.comprovante_validado ?? false,
    cobrar_em_aula:        i?.cobrar_em_aula ?? false,
    url_comprovante:       i?.url_comprovante ?? '',
    pagante_nome_nf:       i?.pagante_nome_nf ?? '',
    pagante_documento:     i?.pagante_documento ?? '',
    pagante_email_nf:      i?.pagante_email_nf ?? '',
    observacoes_negociacao: i?.observacoes_negociacao ?? '',
  }
}

function n(s: string): number | null {
  const v = parseFloat(s.replace(',', '.'))
  return isNaN(v) ? null : v
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-display font-semibold text-muted uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

export default function InscritoModal({ open, onClose, inscrito, turmaId, leadId }: Props) {
  const [form, setForm] = useState<Form>(() => fromInscrito(inscrito))
  const [fluxoSelecionados, setFluxoSelecionados] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Lead[]>([])
  const [searching, setSearching] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const updateInscrito = useUpdateInscrito()
  const createInscrito = useCreateInscrito()
  const isEdit = !!inscrito

  const { data: preloadedLead } = useLead(leadId ?? null)

  useEffect(() => {
    if (!open) return
    setForm(fromInscrito(inscrito))
    setFluxoSelecionados(inscrito?.fluxo_pagamento?.split(',').filter(Boolean) ?? [])
    setSelectedLead(null)
    setSearchQuery('')
    setSearchResults([])
  }, [open, inscrito])

  useEffect(() => {
    if (preloadedLead && !isEdit) {
      setSelectedLead(preloadedLead)
      setForm((f) => ({
        ...f,
        nome: preloadedLead.nome ?? '',
        empresa_oficina: preloadedLead.empresa_oficina ?? '',
      }))
    }
  }, [preloadedLead, isEdit])

  useEffect(() => {
    const total = parseFloat(form.valor_total) || 0
    const entrada = parseFloat(form.valor_entrada) || 0
    if (total > 0) {
      setForm((f) => ({ ...f, saldo_a_receber: String(total - entrada) }))
    }
  }, [form.valor_total, form.valor_entrada])

  useEffect(() => {
    if (!searchQuery.trim() || isEdit) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const q = searchQuery.trim()
        const { data } = await supabase
          .from('leads_v2')
          .select('id, nome, telefone, empresa_oficina, status')
          .eq('status', 'inscrito')
          .or(`nome.ilike.%${q}%,telefone.ilike.%${q}%`)
          .limit(10)
        setSearchResults((data ?? []) as Lead[])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, isEdit])

  function set(field: keyof Form, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleFluxo(value: string) {
    setFluxoSelecionados((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    )
  }

  function selectLead(lead: Lead) {
    setSelectedLead(lead)
    setForm((f) => ({
      ...f,
      nome: lead.nome ?? '',
      empresa_oficina: lead.empresa_oficina ?? '',
    }))
    setSearchQuery('')
    setSearchResults([])
  }

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      let f = file
      if (f.size > 1_500_000) {
        const { default: compress } = await import('browser-image-compression')
        f = await compress(f, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true })
      }
      const ext = f.name.split('.').pop() ?? 'jpg'
      const path = `${turmaId}/${inscrito?.id_inscricao ?? Date.now()}.${ext}`
      const { error } = await supabase.storage.from('comprovantes').upload(path, f, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('comprovantes').getPublicUrl(path)
      set('url_comprovante', data.publicUrl)
      toast.success('Comprovante enviado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error('Selecione um lead ou informe o nome')
      return
    }

    const fluxoCSV = fluxoSelecionados.join(',') || null

    if (isEdit) {
      await updateInscrito.mutateAsync({
        id_inscricao: inscrito!.id_inscricao,
        data: {
          nome:                  form.nome || null,
          empresa_oficina:       form.empresa_oficina || null,
          valor_total:           n(form.valor_total),
          valor_entrada:         n(form.valor_entrada),
          saldo_a_receber:       n(form.saldo_a_receber),
          status_financeiro:     form.status_financeiro || null,
          fluxo_pagamento:       fluxoCSV,
          custodia_entrada:      (form.custodia_entrada || null) as Inscrito['custodia_entrada'],
          comprovante_validado:  form.comprovante_validado,
          cobrar_em_aula:        form.cobrar_em_aula,
          url_comprovante:       form.url_comprovante || null,
          pagante_nome_nf:       form.pagante_nome_nf || null,
          pagante_documento:     form.pagante_documento || null,
          pagante_email_nf:      form.pagante_email_nf || null,
          observacoes_negociacao: form.observacoes_negociacao || null,
        },
      })
      toast.success('Inscrito atualizado')
    } else {
      await createInscrito.mutateAsync({
        id_turma:        turmaId,
        id_lead:         selectedLead?.id,
        nome:            form.nome,
        empresa_oficina: form.empresa_oficina || undefined,
        valor_total:     n(form.valor_total) ?? undefined,
        status_financeiro: form.status_financeiro || undefined,
      })
      toast.success('Inscrito adicionado')
    }
    onClose()
  }

  const saving = updateInscrito.isPending || createInscrito.isPending
  const showLeadSearch = !isEdit && !selectedLead

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Inscrito' : 'Vincular Lead à Turma'}>
      <div className="space-y-5">

        {/* Seleção de lead (modo criação) */}
        {!isEdit && (
          <section className="space-y-3">
            <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Lead</p>

            {selectedLead ? (
              <div className="flex items-center justify-between bg-white/5 border border-orange/30 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-sm font-display font-semibold text-white">{selectedLead.nome}</p>
                  <p className="text-xs text-muted">{selectedLead.empresa_oficina ?? selectedLead.telefone}</p>
                </div>
                {!leadId && (
                  <button
                    type="button"
                    onClick={() => { setSelectedLead(null); set('nome', ''); set('empresa_oficina', '') }}
                    className="text-muted hover:text-white p-1 cursor-pointer"
                    aria-label="Remover lead selecionado"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    className="input-field pl-8"
                    placeholder="Buscar lead por nome ou telefone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {searching && (
                  <p className="text-xs text-muted text-center py-2">Buscando...</p>
                )}
                {searchResults.length > 0 && (
                  <div className="border border-white/10 rounded-lg overflow-hidden">
                    {searchResults.map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => selectLead(lead)}
                        className="w-full text-left px-3 py-2.5 hover:bg-white/10 border-b border-white/5 last:border-0 cursor-pointer transition-colors"
                      >
                        <p className="text-sm font-display font-semibold text-white">{lead.nome ?? lead.telefone}</p>
                        <p className="text-xs text-muted">{lead.empresa_oficina ?? lead.cidade ?? '—'}</p>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length > 1 && !searching && searchResults.length === 0 && (
                  <p className="text-xs text-muted text-center py-2">Nenhum lead com status "Inscrito" encontrado</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* Formulário — exibido após seleção (criação) ou sempre (edição) */}
        {(isEdit || !showLeadSearch) && (
          <>
            {/* Identificação */}
            {isEdit && (
              <section className="space-y-3">
                <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Identificação</p>
                <Field label="Nome *">
                  <input className="input-field" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
                </Field>
                <Field label="Empresa / Oficina">
                  <input className="input-field" value={form.empresa_oficina} onChange={(e) => set('empresa_oficina', e.target.value)} />
                </Field>
              </section>
            )}

            {/* Valores */}
            <section className="space-y-3">
              <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Valores</p>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Total (R$)">
                  <input type="number" className="input-field" value={form.valor_total} onChange={(e) => set('valor_total', e.target.value)} />
                </Field>
                <Field label="Entrada (R$)">
                  <input type="number" className="input-field" value={form.valor_entrada} onChange={(e) => set('valor_entrada', e.target.value)} />
                </Field>
                <Field label="Saldo (R$)">
                  <input type="number" className="input-field" value={form.saldo_a_receber} readOnly />
                </Field>
              </div>
              <Field label="Status Financeiro">
                <select className="input-field" value={form.status_financeiro} onChange={(e) => set('status_financeiro', e.target.value)}>
                  {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </section>

            {/* Pagamento */}
            <section className="space-y-3">
              <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Pagamento</p>
              <Field label="Fluxo de Pagamento">
                <div className="flex flex-wrap gap-2">
                  {FLUXO_OPTS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleFluxo(value)}
                      className={`px-3 py-2 rounded-lg text-xs font-display font-bold transition-colors cursor-pointer border ${
                        fluxoSelecionados.includes(value)
                          ? 'bg-orange border-orange text-white'
                          : 'bg-transparent border-white/20 text-muted hover:border-orange/50 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Custódia Entrada">
                <select className="input-field" value={form.custodia_entrada} onChange={(e) => set('custodia_entrada', e.target.value)}>
                  {CUSTODIA_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 h-9 px-3 bg-white/5 border border-white/20 rounded-lg">
                  <input
                    type="checkbox"
                    id="comprovante_validado"
                    checked={form.comprovante_validado}
                    onChange={(e) => set('comprovante_validado', e.target.checked)}
                    className="w-4 h-4 accent-orange cursor-pointer"
                  />
                  <label htmlFor="comprovante_validado" className="text-sm text-white cursor-pointer">Comprovante validado</label>
                </div>
                <div className="flex items-center gap-2 h-9 px-3 bg-white/5 border border-white/20 rounded-lg">
                  <input
                    type="checkbox"
                    id="cobrar_em_aula"
                    checked={form.cobrar_em_aula}
                    onChange={(e) => set('cobrar_em_aula', e.target.checked)}
                    className="w-4 h-4 accent-orange cursor-pointer"
                  />
                  <label htmlFor="cobrar_em_aula" className="text-sm text-orange font-display font-semibold cursor-pointer">Cobrar em Aula</label>
                </div>
              </div>

              <Field label="Comprovante PIX">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 btn-secondary text-xs px-3 py-2 flex-1 justify-center"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? 'Enviando...' : 'Anexar comprovante'}
                  </button>
                </div>
                {form.url_comprovante && (
                  <a href={form.url_comprovante} target="_blank" rel="noreferrer"
                    className="block text-xs text-orange underline mt-1 truncate">
                    Ver comprovante anexado
                  </a>
                )}
              </Field>
            </section>

            {/* Nota Fiscal */}
            <section className="space-y-3">
              <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Nota Fiscal</p>
              <Field label="Nome Pagante">
                <input className="input-field" value={form.pagante_nome_nf} onChange={(e) => set('pagante_nome_nf', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="CPF / CNPJ">
                  <input className="input-field" value={form.pagante_documento} onChange={(e) => set('pagante_documento', e.target.value)} />
                </Field>
                <Field label="E-mail NF">
                  <input type="email" className="input-field" value={form.pagante_email_nf} onChange={(e) => set('pagante_email_nf', e.target.value)} />
                </Field>
              </div>
            </section>

            {/* Observações */}
            <section className="space-y-3">
              <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Observações</p>
              <textarea
                rows={3}
                className="input-field resize-none"
                value={form.observacoes_negociacao}
                onChange={(e) => set('observacoes_negociacao', e.target.value)}
              />
            </section>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || (!isEdit && !selectedLead)}
            className="btn-primary flex-1 py-2.5"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={onClose} className="btn-secondary px-5">
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  )
}
