import { useState, useEffect, useRef } from 'react'
import Modal from '@/components/ui/Modal'
import { useUpdateInscrito, useCreateInscrito, useDeleteInscrito } from '@/hooks/useInscritos'
import { useSearchEmpresas, useCreateEmpresa, useUpdateEmpresa, useEmpresaById } from '@/hooks/useEmpresasCadastradas'
import { useLead } from '@/hooks/useLeads'
import { supabase } from '@/lib/supabase'
import type { Inscrito, Lead, Empresa } from '@/lib/types'
import { toast } from 'sonner'
import { Upload, Loader2, Search, X, Trash2, Copy, Send, Link2 } from 'lucide-react'

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
  { value: 'pix_direto',         label: 'PIX' },
  { value: 'dinheiro',           label: 'Dinheiro' },
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

const CRM_URL = 'https://crm.ayalaoficial.com.br'

type Form = {
  nome: string
  empresa_oficina: string
  cpf: string
  valor_total: string
  valor_entrada: string
  saldo_a_receber: string
  status_financeiro: string
  custodia_entrada: string
  qtd_parcelas: string
  comprovante_validado: boolean
  cobrar_em_aula: boolean
  url_comprovante: string
  pagante_nome_nf: string
  pagante_documento: string
  pagante_email_nf: string
  observacoes_negociacao: string
  // PJ fields
  empresa_id: string
  pj_nome_fantasia: string
  pj_razao_social: string
  pj_cnpj: string
  pj_inscricao_estadual: string
  pj_endereco: string
  pj_bairro: string
  pj_cep: string
  pj_cidade: string
  pj_estado: string
  pj_email: string
  pj_nome_responsavel: string
  pj_whatsapp_responsavel: string
}

function fromInscrito(i: Inscrito | null): Form {
  return {
    nome:                  i?.nome ?? '',
    empresa_oficina:       i?.empresa_oficina ?? '',
    cpf:                   i?.cpf ?? '',
    valor_total:           String(i?.valor_total ?? ''),
    valor_entrada:         String(i?.valor_entrada ?? ''),
    saldo_a_receber:       String(i?.saldo_a_receber ?? ''),
    status_financeiro:     i?.status_financeiro ?? '',
    custodia_entrada:      i?.custodia_entrada ?? '',
    qtd_parcelas:          String(i?.qtd_parcelas ?? ''),
    comprovante_validado:  i?.comprovante_validado ?? false,
    cobrar_em_aula:        i?.cobrar_em_aula ?? false,
    url_comprovante:       i?.url_comprovante ?? '',
    pagante_nome_nf:       i?.pagante_nome_nf ?? '',
    pagante_documento:     i?.pagante_documento ?? '',
    pagante_email_nf:      i?.pagante_email_nf ?? '',
    observacoes_negociacao: i?.observacoes_negociacao ?? '',
    empresa_id:            i?.empresa_id ?? '',
    pj_nome_fantasia:      '',
    pj_razao_social:       '',
    pj_cnpj:               '',
    pj_inscricao_estadual: '',
    pj_endereco:           '',
    pj_bairro:             '',
    pj_cep:                '',
    pj_cidade:             '',
    pj_estado:             '',
    pj_email:              '',
    pj_nome_responsavel:   '',
    pj_whatsapp_responsavel: '',
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

function EmpresaSearch({ onSelect }: { onSelect: (e: Empresa) => void }) {
  const [q, setQ] = useState('')
  const { data: results = [] } = useSearchEmpresas(q)

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          className="input-field pl-8 text-xs"
          placeholder="Buscar empresa por CNPJ ou razão social..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {results.length > 0 && (
        <div className="border border-white/10 rounded-lg overflow-hidden">
          {results.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => { onSelect(e); setQ('') }}
              className="w-full text-left px-3 py-2 hover:bg-white/10 border-b border-white/5 last:border-0 cursor-pointer transition-colors"
            >
              <p className="text-xs font-display font-semibold text-white">{e.razao_social ?? e.nome_fantasia ?? '—'}</p>
              <p className="text-xs text-muted">{e.cnpj ?? ''} {e.cidade ? `· ${e.cidade}` : ''}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function InscritoModal({ open, onClose, inscrito, turmaId, leadId }: Props) {
  const [currentInscrito, setCurrentInscrito] = useState<Inscrito | null>(inscrito)
  const [form, setForm] = useState<Form>(() => fromInscrito(inscrito))
  const [fluxoSelecionados, setFluxoSelecionados] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Lead[]>([])
  const [searching, setSearching] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showEmpresaSuggestions, setShowEmpresaSuggestions] = useState(false)
  const [ensuringEmpresaToken, setEnsuringEmpresaToken] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { data: empresaSuggestions = [] } = useSearchEmpresas(form.empresa_oficina)
  const updateInscrito = useUpdateInscrito()
  const createInscrito = useCreateInscrito()
  const deleteInscrito = useDeleteInscrito()
  const createEmpresa = useCreateEmpresa()
  const updateEmpresa = useUpdateEmpresa()
  const activeInscrito = currentInscrito ?? inscrito
  const isEdit = !!activeInscrito

  const { data: preloadedLead } = useLead(leadId ?? null)
  const { data: leadData } = useLead(isEdit ? (activeInscrito?.id_lead ?? null) : null)
  const { data: linkedEmpresa } = useEmpresaById(form.empresa_id || activeInscrito?.empresa_id || null)

  useEffect(() => {
    if (!open) return
    setCurrentInscrito(inscrito)
    setForm(fromInscrito(inscrito))
    setFluxoSelecionados(inscrito?.fluxo_pagamento?.split(',').filter(Boolean) ?? [])
    setSelectedLead(null)
    setSearchQuery('')
    setSearchResults([])
    setConfirmDelete(false)
  }, [open, inscrito])

  // Carregar dados PJ da empresa vinculada ao abrir edição
  useEffect(() => {
    if (!open || !activeInscrito?.empresa_id) return
    supabase
      .from('empresas_cadastradas')
      .select('*')
      .eq('id', activeInscrito.empresa_id)
      .single()
      .then(({ data }) => {
        if (!data) return
        fillEmpresaFields(data as Empresa)
      })
  }, [open, activeInscrito?.empresa_id])

  useEffect(() => {
    if (!open || !linkedEmpresa || linkedEmpresa.fill_token || ensuringEmpresaToken) return
    setEnsuringEmpresaToken(true)
    const fillToken = crypto.randomUUID()
    updateEmpresa.mutateAsync({
      id: linkedEmpresa.id,
      data: {
        fill_token: fillToken,
        fill_status: linkedEmpresa.fill_status ?? 'pendente',
      } as Partial<Empresa>,
    }).catch(() => {
      toast.error('Não foi possível preparar o link público da empresa.')
    }).finally(() => {
      setEnsuringEmpresaToken(false)
    })
  }, [open, linkedEmpresa, ensuringEmpresaToken, updateEmpresa])

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
          .select('id, nome, telefone, empresa_oficina, status, empresa_id')
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
    if (lead.empresa_id) {
      supabase
        .from('empresas_cadastradas')
        .select('*')
        .eq('id', lead.empresa_id)
        .single()
        .then(({ data }) => {
          if (data) fillEmpresaFields(data as Empresa)
        })
    }
  }

  function fillEmpresaFields(e: Empresa) {
    setForm((f) => ({
      ...f,
      empresa_id:             e.id,
      pj_nome_fantasia:       e.nome_fantasia ?? '',
      pj_razao_social:        e.razao_social ?? '',
      pj_cnpj:                e.cnpj ?? '',
      pj_inscricao_estadual:  e.inscricao_estadual ?? '',
      pj_endereco:            e.endereco ?? '',
      pj_bairro:              e.bairro ?? '',
      pj_cep:                 e.cep ?? '',
      pj_cidade:              e.cidade ?? '',
      pj_estado:              e.estado ?? '',
      pj_email:               e.email ?? '',
      pj_nome_responsavel:    e.nome_responsavel ?? '',
      pj_whatsapp_responsavel: e.whatsapp_responsavel ?? '',
    }))
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

  async function handleDelete() {
    if (!inscrito) return
    try {
      await deleteInscrito.mutateAsync(inscrito.id_inscricao)
      toast.success('Inscrição cancelada')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar inscrição')
    }
  }

  async function resolveEmpresaId(): Promise<string | null> {
    const hasPjData = form.pj_razao_social || form.pj_cnpj
    if (!hasPjData) return form.empresa_id || null

    const pjPayload: Omit<Empresa, 'id' | 'created_at' | 'updated_at' | 'fill_token' | 'fill_status'> = {
      tipo:                 'pj',
      cpf:                  null,
      nome_fantasia:        form.pj_nome_fantasia || null,
      razao_social:         form.pj_razao_social || null,
      cnpj:                 form.pj_cnpj || null,
      inscricao_estadual:   form.pj_inscricao_estadual || null,
      endereco:             form.pj_endereco || null,
      bairro:               form.pj_bairro || null,
      cep:                  form.pj_cep || null,
      cidade:               form.pj_cidade || null,
      estado:               form.pj_estado || null,
      email:                form.pj_email || null,
      nome_responsavel:     form.pj_nome_responsavel || null,
      whatsapp_responsavel: form.pj_whatsapp_responsavel || null,
    }

    if (form.empresa_id) {
      await updateEmpresa.mutateAsync({ id: form.empresa_id, data: pjPayload })
      return form.empresa_id
    } else {
      const created = await createEmpresa.mutateAsync(pjPayload)
      return created.id
    }
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error('Selecione um lead ou informe o nome')
      return
    }

    const fluxoCSV = fluxoSelecionados.join(',') || null

    try {
      const empresaId = await resolveEmpresaId()

      if (isEdit) {
        await updateInscrito.mutateAsync({
            id_inscricao: activeInscrito!.id_inscricao,
            data: {
            nome:                  form.nome || null,
            empresa_oficina:       form.empresa_oficina || null,
            cpf:                   form.cpf || null,
            valor_total:           n(form.valor_total),
            valor_entrada:         n(form.valor_entrada),
            saldo_a_receber:       n(form.saldo_a_receber),
            status_financeiro:     form.status_financeiro || null,
            fluxo_pagamento:       fluxoCSV,
            qtd_parcelas:          form.qtd_parcelas ? parseInt(form.qtd_parcelas, 10) : null,
            custodia_entrada:      (form.custodia_entrada || null) as Inscrito['custodia_entrada'],
            comprovante_validado:  form.comprovante_validado,
            cobrar_em_aula:        form.cobrar_em_aula,
            url_comprovante:       form.url_comprovante || null,
            pagante_nome_nf:       form.pagante_nome_nf || null,
            pagante_documento:     form.pagante_documento || null,
            pagante_email_nf:      form.pagante_email_nf || null,
            observacoes_negociacao: form.observacoes_negociacao || null,
            empresa_id:            empresaId,
          },
        })
        setCurrentInscrito((prev) => prev ? { ...prev, empresa_id: empresaId } : prev)
        if (empresaId) {
          setForm((prev) => ({ ...prev, empresa_id: empresaId }))
        }
        toast.success('Inscrito atualizado. Os links permanecem disponíveis abaixo.')
      } else {
        const created = await createInscrito.mutateAsync({
          id_turma:        turmaId,
          id_lead:         selectedLead?.id ?? null,
          nome:            form.nome,
          empresa_oficina: form.empresa_oficina || null,
          cpf: form.cpf || null,
          valor_total: n(form.valor_total),
          valor_entrada: n(form.valor_entrada),
          saldo_a_receber: n(form.saldo_a_receber),
          status_financeiro: form.status_financeiro || 'pendente',
          fluxo_pagamento: fluxoCSV,
          qtd_parcelas: form.qtd_parcelas ? parseInt(form.qtd_parcelas, 10) : null,
          custodia_entrada: (form.custodia_entrada || null) as Inscrito['custodia_entrada'],
          comprovante_validado: form.comprovante_validado,
          cobrar_em_aula: form.cobrar_em_aula,
          url_comprovante: form.url_comprovante || null,
          pagante_nome_nf: form.pagante_nome_nf || null,
          pagante_documento: form.pagante_documento || null,
          pagante_email_nf: form.pagante_email_nf || null,
          observacoes_negociacao: form.observacoes_negociacao || null,
          empresa_id: empresaId,
        })
        setCurrentInscrito(created)
        if (empresaId) {
          setForm((prev) => ({ ...prev, empresa_id: empresaId }))
        }

        // Vincular turma ao lead e decrementar vagas
        const sideEffects: PromiseLike<unknown>[] = []
        if (selectedLead?.id) {
          sideEffects.push(
            supabase
              .from('leads_v2')
              .update({ turma_selecionada: turmaId, status: 'cliente' })
              .eq('id', selectedLead.id)
              .then(({ error }) => {
                if (error) console.error('Falha ao vincular turma no lead:', error.message)
              }),
          )
        }
        sideEffects.push(
          supabase.rpc('fn_decrementar_vaga', { p_turma_id: turmaId }).then(({ error }) => {
            if (error) console.error('Falha ao decrementar vaga:', error.message)
          }),
        )
        await Promise.allSettled(sideEffects)

        toast.success('Inscrito adicionado. Os links de formulário foram liberados.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  const saving = updateInscrito.isPending || createInscrito.isPending || createEmpresa.isPending || updateEmpresa.isPending
  const showLeadSearch = !isEdit && !selectedLead
  const participantToken = activeInscrito?.fill_token ?? null
  const participantPhone = (leadData?.telefone ?? selectedLead?.telefone ?? '').replace(/\D/g, '')
  const participantName = leadData?.nome ?? selectedLead?.nome ?? activeInscrito?.nome ?? form.nome ?? null
  const empresaToken = linkedEmpresa?.fill_token ?? null
  const empresaPhone = (linkedEmpresa?.whatsapp_responsavel ?? form.pj_whatsapp_responsavel ?? '').replace(/\D/g, '')
  const empresaResponsavel = linkedEmpresa?.nome_responsavel ?? form.pj_nome_responsavel ?? null
  const financeiroPhone = (leadData?.telefone_financeiro ?? preloadedLead?.telefone_financeiro ?? '').replace(/\D/g, '')

  function buildPublicFormUrl(token: string) {
    return `${CRM_URL}/cadastro/${token}`
  }

  function buildWhatsappLink(token: string, message: string, phoneDigits?: string) {
    const encoded = encodeURIComponent(`${message}\n${buildPublicFormUrl(token)}`)
    return phoneDigits
      ? `https://wa.me/${phoneDigits}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`
  }

  function copyToClipboard(text: string, successMessage: string) {
    navigator.clipboard.writeText(text)
    toast.success(successMessage)
  }

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
                {searching && <p className="text-xs text-muted text-center py-2">Buscando...</p>}
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

        {/* Formulário */}
        {(isEdit || !showLeadSearch) && (
          <>
            {/* Identificação */}
            {isEdit && (
              <section className="space-y-3">
                <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Identificação</p>
                <Field label="Nome *">
                  <input className="input-field" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
                </Field>
                {leadData?.telefone && (
                  <Field label="WhatsApp">
                    <input
                      className="input-field opacity-60 cursor-not-allowed"
                      value={leadData.telefone}
                      readOnly
                      title="Telefone registrado no lead"
                    />
                  </Field>
                )}
                <Field label="CPF do Participante">
                  <input
                    className="input-field"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => set('cpf', e.target.value)}
                  />
                </Field>
                <Field label="Empresa / Oficina">
                  <div className="relative">
                    <input
                      className="input-field"
                      value={form.empresa_oficina}
                      onChange={(e) => { set('empresa_oficina', e.target.value); setShowEmpresaSuggestions(true) }}
                      onBlur={() => setTimeout(() => setShowEmpresaSuggestions(false), 150)}
                    />
                    {showEmpresaSuggestions && empresaSuggestions.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 border border-white/10 rounded-lg bg-navy overflow-hidden shadow-lg">
                        {empresaSuggestions.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => {
                              set('empresa_oficina', emp.nome_fantasia ?? emp.razao_social ?? '')
                              fillEmpresaFields(emp)
                              setShowEmpresaSuggestions(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-white/10 border-b border-white/5 last:border-0 cursor-pointer transition-colors"
                          >
                            <p className="text-xs font-display font-semibold text-white">{emp.razao_social ?? emp.nome_fantasia}</p>
                            <p className="text-xs text-muted">{emp.cnpj ?? ''}{emp.cidade ? ` · ${emp.cidade}` : ''}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
              <div className="grid grid-cols-2 gap-2">
                <Field label="Entrada Recebida Por">
                  <select className="input-field" value={form.custodia_entrada} onChange={(e) => set('custodia_entrada', e.target.value)}>
                    {CUSTODIA_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Em Quantas Vezes">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className="input-field"
                    placeholder="1"
                    value={form.qtd_parcelas}
                    onChange={(e) => set('qtd_parcelas', e.target.value)}
                  />
                </Field>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 h-9 px-3 bg-white/5 border border-white/20 rounded-lg">
                  <input type="checkbox" id="comprovante_validado" checked={form.comprovante_validado} onChange={(e) => set('comprovante_validado', e.target.checked)} className="w-4 h-4 accent-orange cursor-pointer" />
                  <label htmlFor="comprovante_validado" className="text-sm text-white cursor-pointer">Comprovante validado</label>
                </div>
                <div className="flex items-center gap-2 h-9 px-3 bg-white/5 border border-white/20 rounded-lg">
                  <input type="checkbox" id="cobrar_em_aula" checked={form.cobrar_em_aula} onChange={(e) => set('cobrar_em_aula', e.target.checked)} className="w-4 h-4 accent-orange cursor-pointer" />
                  <label htmlFor="cobrar_em_aula" className="text-sm text-orange font-display font-semibold cursor-pointer">Cobrar em Aula</label>
                </div>
              </div>
              <Field label="Comprovante PIX">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 btn-secondary text-xs px-3 py-2 flex-1 justify-center">
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? 'Enviando...' : 'Anexar comprovante'}
                  </button>
                </div>
                {form.url_comprovante && (
                  <a href={form.url_comprovante} target="_blank" rel="noreferrer" className="block text-xs text-orange underline mt-1 truncate">
                    Ver comprovante anexado
                  </a>
                )}
              </Field>
            </section>

            {/* Nota Fiscal */}
            <section className="space-y-3">
              <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Nota Fiscal</p>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Link2 size={13} className="text-orange" />
                    <p className="text-xs font-display font-bold text-white uppercase tracking-wide">Formulário do Participante</p>
                  </div>
                  {participantToken ? (
                    <>
                      <p className="text-[11px] text-slate-400">
                        Envie para o aluno preencher nome, CPF e WhatsApp, com vínculo automático à inscrição.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(buildPublicFormUrl(participantToken), 'Link do participante copiado')}
                          className="btn-secondary text-xs px-3 py-2 flex-1 flex items-center justify-center gap-1.5"
                        >
                          <Copy size={12} />
                          Copiar link
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(
                            buildWhatsappLink(
                              participantToken,
                              `Olá${participantName ? `, ${participantName.split(' ')[0]}` : ''}! 😊\n\nPara confirmar sua inscrição no treinamento, preencha este formulário:`,
                              participantPhone || undefined,
                            ),
                            '_blank',
                          )}
                          className="btn-primary text-xs px-3 py-2 flex-1 flex items-center justify-center gap-1.5"
                        >
                          <Send size={12} />
                          Enviar WPP
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                  Salve a inscrição primeiro para liberar o link público do participante.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Link2 size={13} className="text-orange" />
                    <p className="text-xs font-display font-bold text-white uppercase tracking-wide">Formulário da Empresa</p>
                  </div>
                  {empresaToken ? (
                    <>
                      <p className="text-[11px] text-slate-400">
                        Envie para a oficina preencher os dados PJ e manter o faturamento vinculado ao CRM.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(buildPublicFormUrl(empresaToken), 'Link da empresa copiado')}
                          className="btn-secondary text-xs px-3 py-2 flex-1 flex items-center justify-center gap-1.5"
                        >
                          <Copy size={12} />
                          Copiar link
                        </button>
                        {financeiroPhone ? (
                          <>
                            <button
                              type="button"
                              onClick={() => window.open(
                                buildWhatsappLink(
                                  empresaToken,
                                  `Olá${empresaResponsavel ? `, ${empresaResponsavel.split(' ')[0]}` : ''}! 😊\n\nPara confirmar a inscrição no treinamento, precisamos dos dados da empresa. Preencha este formulário:`,
                                  empresaPhone || undefined,
                                ),
                                '_blank',
                              )}
                              className="btn-secondary text-xs px-2 py-2 flex items-center justify-center gap-1"
                            >
                              <Send size={11} /> Lead
                            </button>
                            <button
                              type="button"
                              onClick={() => window.open(
                                buildWhatsappLink(
                                  empresaToken,
                                  `Olá! 😊\n\nPara confirmar a inscrição no treinamento, precisamos dos dados da empresa. Preencha este formulário:`,
                                  financeiroPhone,
                                ),
                                '_blank',
                              )}
                              className="btn-primary text-xs px-2 py-2 flex items-center justify-center gap-1"
                            >
                              <Send size={11} /> Financeiro
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => window.open(
                              buildWhatsappLink(
                                empresaToken,
                                `Olá${empresaResponsavel ? `, ${empresaResponsavel.split(' ')[0]}` : ''}! 😊\n\nPara confirmar a inscrição no treinamento, precisamos dos dados da empresa. Preencha este formulário:`,
                                empresaPhone || undefined,
                              ),
                              '_blank',
                            )}
                            className="btn-primary text-xs px-3 py-2 flex-1 flex items-center justify-center gap-1.5"
                          >
                            <Send size={12} />
                            Enviar WPP
                          </button>
                        )}
                      </div>
                    </>
                  ) : form.empresa_id || activeInscrito?.empresa_id ? (
                    <p className="text-[11px] text-slate-500">
                      Preparando link da empresa...
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Preencha ou vincule a empresa e salve a inscrição para liberar o link público PJ.
                    </p>
                  )}
                </div>
              </div>

              {/* PF */}
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

              {/* PJ */}
              <div className="border-t border-white/10 pt-3 space-y-3">
                <p className="text-xs font-display font-semibold text-white/60 uppercase tracking-wide">Dados PJ (Pessoa Jurídica)</p>

                {/* Sugestão automática: empresa encontrada pelo nome do lead */}
                {!form.empresa_id && empresaSuggestions.length > 0 && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                    <p className="text-xs font-display font-semibold text-amber-300">
                      Empresa encontrada nos registros — clique para preencher automaticamente
                    </p>
                    {empresaSuggestions.slice(0, 3).map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => fillEmpresaFields(emp)}
                        className="w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/50 transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">{emp.razao_social ?? emp.nome_fantasia}</p>
                          <p className="text-xs text-slate-400">{emp.cnpj ? `CNPJ ${emp.cnpj}` : ''}{emp.cidade ? ` · ${emp.cidade}` : ''}</p>
                        </div>
                        <span className="text-xs font-bold text-amber-400 shrink-0">Usar →</span>
                      </button>
                    ))}
                  </div>
                )}

                {form.empresa_id && (
                  <p className="text-xs text-green-400">Empresa vinculada · dados serão atualizados ao salvar</p>
                )}

                <EmpresaSearch onSelect={fillEmpresaFields} />
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Nome Fantasia">
                    <input className="input-field text-xs" value={form.pj_nome_fantasia} onChange={(e) => set('pj_nome_fantasia', e.target.value)} />
                  </Field>
                  <Field label="Razão Social">
                    <input className="input-field text-xs" value={form.pj_razao_social} onChange={(e) => set('pj_razao_social', e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="CNPJ">
                    <input className="input-field text-xs" placeholder="00.000.000/0000-00" value={form.pj_cnpj} onChange={(e) => set('pj_cnpj', e.target.value)} />
                  </Field>
                  <Field label="Inscrição Estadual">
                    <input className="input-field text-xs" value={form.pj_inscricao_estadual} onChange={(e) => set('pj_inscricao_estadual', e.target.value)} />
                  </Field>
                </div>
                <Field label="Endereço">
                  <input className="input-field text-xs" value={form.pj_endereco} onChange={(e) => set('pj_endereco', e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Bairro">
                    <input className="input-field text-xs" value={form.pj_bairro} onChange={(e) => set('pj_bairro', e.target.value)} />
                  </Field>
                  <Field label="CEP">
                    <input className="input-field text-xs" placeholder="00000-000" value={form.pj_cep} onChange={(e) => set('pj_cep', e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Cidade">
                    <input className="input-field text-xs" value={form.pj_cidade} onChange={(e) => set('pj_cidade', e.target.value)} />
                  </Field>
                  <Field label="Estado">
                    <input className="input-field text-xs" placeholder="UF" value={form.pj_estado} onChange={(e) => set('pj_estado', e.target.value)} />
                  </Field>
                </div>
                <Field label="E-mail Empresa">
                  <input type="email" className="input-field text-xs" value={form.pj_email} onChange={(e) => set('pj_email', e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Nome Responsável">
                    <input className="input-field text-xs" value={form.pj_nome_responsavel} onChange={(e) => set('pj_nome_responsavel', e.target.value)} />
                  </Field>
                  <Field label="WhatsApp Responsável">
                    <input className="input-field text-xs" value={form.pj_whatsapp_responsavel} onChange={(e) => set('pj_whatsapp_responsavel', e.target.value)} />
                  </Field>
                </div>
              </div>
            </section>

            {/* Observações */}
            <section className="space-y-3">
              <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Observações</p>
              <textarea rows={3} className="input-field resize-none" value={form.observacoes_negociacao} onChange={(e) => set('observacoes_negociacao', e.target.value)} />
            </section>
          </>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || (!isEdit && !selectedLead)} className="btn-primary flex-1 py-2.5">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={onClose} className="btn-secondary px-5">
              Cancelar
            </button>
          </div>

          {isEdit && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg py-2.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} /> Cancelar Inscrição
            </button>
          )}

          {isEdit && confirmDelete && (
            <div className="border border-red-500/40 rounded-lg p-3 space-y-2 bg-red-950/20">
              <p className="text-xs text-red-300 text-center">
                Confirmar cancelamento de inscrição de <strong>{inscrito?.nome}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteInscrito.isPending}
                  className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 font-semibold transition-colors cursor-pointer"
                >
                  {deleteInscrito.isPending ? 'Cancelando...' : 'Sim, cancelar inscrição'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 text-xs btn-secondary py-2"
                >
                  Manter inscrito
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
