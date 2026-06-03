import {
  Phone, MessageCircle, X, User, Building2, MapPin, Calendar, Edit2, Check, Send,
  ArrowRightLeft, GraduationCap, Trash2, AlertCircle, Wrench, ExternalLink, BellRing,
} from 'lucide-react'
import EmpresaSection from '@/components/empresas/EmpresaSection'
import { useLead, useUpdateLead, useDeleteLead, useTurma } from '@/hooks/useLeads'
import { useSearchProspectos, useProspecto, useCreateProspecto } from '@/hooks/useProspectos'
import type { Prospecto } from '@/hooks/useProspectos'
import {
  ETIQUETA_CORES, ETIQUETA_LABELS, MARCA_BADGES, INTERESSE_TAGS, formatPhone, initials, relativeTime,
  STATUS_ALL_OPTIONS, CANAL_ORIGEM_OPTIONS, PORTE_OFICINA_OPTIONS, PERFIL_OPTIONS, UF_OPTIONS,
  getLeadActionSignals, getPrimaryLeadLabel, isSuspiciousCity, normalizeCity,
} from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import MoverLeadSheet from '@/components/MoverLeadSheet'

const CHAT_BASE = 'https://chat.ayalaoficial.com.br'
const MARCAS = ['', 'Volvo', 'DAF', 'Scania']

interface Props {
  leadId: string
  onClose: () => void
}

type EditForm = {
  nome: string
  empresa_oficina: string
  cidade: string
  uf: string
  perfil: string
  status: string
  marca_interesse: string
  potencial: string
  proximo_passo: string
  data_retorno: string
  canal_origem: string
  observacoes: string
  interesses: string[]
  requer_atencao: boolean
  porte_oficina: string
  qtd_interessados: string
  telefone_financeiro: string
  telefone_oficina: string
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

function ButtonGroup({
  options,
  value,
  onChange,
  cols,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  cols?: number
}) {
  return (
    <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${cols ?? options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(value === o.value ? '' : o.value)}
          className={`rounded-lg text-xs font-display font-bold py-2.5 px-2 transition-colors cursor-pointer border ${
            value === o.value
              ? 'border-orange bg-orange/10 text-orange'
              : 'border-white/10 bg-white/5 text-muted hover:border-orange/40 hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function LeadDetail({ leadId, onClose }: Props) {
  const { data: lead, isLoading } = useLead(leadId)
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()
  const navigate = useNavigate()
  const [editMode, setEditMode] = useState(false)
  const [moveSheetOpen, setMoveSheetOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [nota, setNota] = useState('')
  const [savingNota, setSavingNota] = useState(false)
  const [criarOficinaOpen, setCriarOficinaOpen] = useState(false)
  const [criarOficinaForm, setCriarOficinaForm] = useState({ empresa_oficina: '', cidade: '', uf: '', telefone_oficina: '' })
  const [form, setForm] = useState<EditForm>({
    nome: '', empresa_oficina: '', cidade: '', uf: '', perfil: '',
    status: '', marca_interesse: '', potencial: '', proximo_passo: '', data_retorno: '',
    canal_origem: '', observacoes: '', interesses: [],
    requer_atencao: false, porte_oficina: '', qtd_interessados: '',
    telefone_financeiro: '', telefone_oficina: '',
  })

  const { data: turma } = useTurma(lead?.turma_selecionada ?? null)
  const { data: prospectoVinculado } = useProspecto(lead?.id_prospecto ?? null)
  const createProspecto = useCreateProspecto()
  const { data: prospectoSuggestions = [] } = useSearchProspectos(
    !lead?.id_prospecto && (lead?.empresa_oficina?.length ?? 0) >= 2 ? (lead?.empresa_oficina ?? '') : ''
  )

  useEffect(() => {
    if (lead) {
      setForm({
        nome:             lead.nome ?? '',
        empresa_oficina:  lead.empresa_oficina ?? '',
        cidade:           lead.cidade ?? '',
        uf:               lead.uf ?? '',
        perfil:           lead.perfil ?? '',
        status:           lead.status ?? '',
        marca_interesse:  lead.marca_interesse ?? '',
        potencial:        lead.potencial ?? '',
        proximo_passo:    lead.proximo_passo ?? '',
        data_retorno:     lead.data_retorno ?? '',
        canal_origem:     lead.canal_origem ?? '',
        observacoes:      lead.observacoes ?? '',
        interesses:       lead.interesses ?? [],
        requer_atencao:   lead.requer_atencao ?? false,
        porte_oficina:    lead.porte_oficina ?? '',
        qtd_interessados: lead.qtd_interessados ?? '',
        telefone_financeiro: lead.telefone_financeiro ?? '',
        telefone_oficina:    lead.telefone_oficina ?? '',
      })
    }
  }, [lead])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!lead) return null
  const actionSignals = getLeadActionSignals(lead)
  const primaryLabel = getPrimaryLeadLabel(lead.etiqueta_chatwoot)
  const hidePrimaryLabel = primaryLabel != null && actionSignals.some((signal) =>
    signal.id === primaryLabel || (signal.id === 'follow_up' && primaryLabel === 'visualizou_preco'),
  )
  const etiquetaCor = primaryLabel ? ETIQUETA_CORES[primaryLabel] : null
  const etiquetaLabel = primaryLabel ? ETIQUETA_LABELS[primaryLabel] ?? primaryLabel : null
  const marca = lead.marca_interesse ? MARCA_BADGES[lead.marca_interesse] : null

  function set<K extends keyof EditForm>(field: K, value: EditForm[K]) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleInteresse(value: string) {
    setForm((f) => ({
      ...f,
      interesses: f.interesses.includes(value)
        ? f.interesses.filter((i) => i !== value)
        : [...f.interesses, value],
    }))
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await deleteLead.mutateAsync(lead!.id)
    toast.success('Lead removido')
    onClose()
  }

  async function handleLinkProspecto(prospecto: Prospecto) {
    await updateLead.mutateAsync({
      id: lead!.id,
      data: {
        id_prospecto: prospecto.id_visita,
        ...(prospecto.empresa_id && !lead!.empresa_id ? { empresa_id: prospecto.empresa_id } : {}),
      },
    })
    toast.success(`Lead vinculado à oficina ${prospecto.empresa_oficina}`)
  }

  async function handleCriarOficina() {
    const { empresa_oficina, cidade, uf, telefone_oficina } = criarOficinaForm
    if (!empresa_oficina.trim()) { toast.error('Informe o nome da oficina'); return }
    try {
      const novo = await createProspecto.mutateAsync({
        empresa_oficina: empresa_oficina.trim() || null,
        cidade: cidade.trim() || null,
        uf: uf.trim() || null,
        telefone_oficina: telefone_oficina.trim() || null,
        status_contato: 'a_contatar',
        multimarcas: true,
        qualificado_lead: false,
        convertido_lead: false,
      })
      await updateLead.mutateAsync({ id: lead!.id, data: { id_prospecto: novo.id_visita } })
      setCriarOficinaOpen(false)
      toast.success('Oficina criada e vinculada ao lead')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar oficina')
    }
  }

  async function handlePassarParaPaola() {
    const novasEtiquetas = lead!.etiqueta_chatwoot
      ? `${lead!.etiqueta_chatwoot},para_paola`
      : 'para_paola'
    await updateLead.mutateAsync({
      id: lead!.id,
      data: { consultor: 'Paola', requer_atencao: true, etiqueta_chatwoot: novasEtiquetas },
    })
    toast.success('Lead passado para a Paola')
  }

  async function handleSaveNota() {
    if (!nota.trim() || !lead) return
    setSavingNota(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const autor = user?.email ?? 'sistema'
      const ts = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      const linha = `[${ts} — ${autor}] ${nota.trim()}`
      const obs = lead.observacoes ? `${lead.observacoes}\n${linha}` : linha
      await updateLead.mutateAsync({ id: lead.id, data: { observacoes: obs } })
      setNota('')
      toast.success('Anotação salva')
    } finally {
      setSavingNota(false)
    }
  }

  async function handleSave() {
    const cidade = normalizeCity(form.cidade)
    if (form.cidade.trim() && (!cidade || isSuspiciousCity(form.cidade))) {
      toast.error('Cidade parece inválida. Revise o campo antes de salvar.')
      return
    }

    try {
      await updateLead.mutateAsync({
        id: lead!.id,
        data: {
          nome:             form.nome || null,
          empresa_oficina:  form.empresa_oficina || null,
          cidade:           cidade,
          uf:               form.uf || null,
          perfil:           form.perfil || null,
          status:           form.status || null,
          marca_interesse:  form.marca_interesse || null,
          potencial:        form.potencial || null,
          telefone_financeiro: form.telefone_financeiro || null,
          telefone_oficina:    form.telefone_oficina || null,
          proximo_passo:    form.proximo_passo || null,
          data_retorno:     form.data_retorno || null,
          canal_origem:     form.canal_origem || null,
          observacoes:      form.observacoes || null,
          interesses:       form.interesses.length > 0 ? form.interesses : null,
          requer_atencao:   form.requer_atencao,
          porte_oficina:    form.porte_oficina || null,
          qtd_interessados: form.qtd_interessados || null,
        },
      })
      toast.success('Lead atualizado')
      setEditMode(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar lead')
    }
  }

  /* ── EDIT MODE ── */
  if (editMode) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h2 className="font-display font-bold text-white text-base">Editar Lead</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={updateLead.isPending}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Check size={13} />
              {updateLead.isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setEditMode(false)} className="btn-secondary text-xs px-3 py-1.5">
              Cancelar
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Identificação */}
          <section className="space-y-3">
            <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Identificação</p>
            <Field label="Nome">
              <input className="input-field" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
            </Field>
            <Field label="Empresa / Oficina">
              <input className="input-field" value={form.empresa_oficina} onChange={(e) => set('empresa_oficina', e.target.value)} />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Field label="Cidade">
                  <input className="input-field" value={form.cidade} onChange={(e) => set('cidade', e.target.value)} />
                </Field>
              </div>
              <Field label="UF">
                <select className="input-field" value={form.uf} onChange={(e) => set('uf', e.target.value)}>
                  <option value="">—</option>
                  {UF_OPTIONS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Tel. Oficina / Geral">
                <input type="tel" className="input-field" placeholder="(47) 3333-4444" value={form.telefone_oficina} onChange={(e) => set('telefone_oficina', e.target.value)} />
              </Field>
              <Field label="Tel. Financeiro / RH">
                <input type="tel" className="input-field" placeholder="(47) 3333-5555" value={form.telefone_financeiro} onChange={(e) => set('telefone_financeiro', e.target.value)} />
              </Field>
            </div>
            <Field label="Porte da Oficina">
              <ButtonGroup options={PORTE_OFICINA_OPTIONS} value={form.porte_oficina} onChange={(v) => set('porte_oficina', v)} />
            </Field>
          </section>

          {/* Qualificação */}
          <section className="space-y-3">
            <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Qualificação</p>
            <Field label="Tipo do Lead">
              <ButtonGroup options={PERFIL_OPTIONS} value={form.perfil} onChange={(v) => set('perfil', v)} />
            </Field>
            {form.perfil === 'grupo_b2b' && (
              <Field label="Qtd. de interessados">
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={form.qtd_interessados}
                  onChange={(e) => set('qtd_interessados', e.target.value)}
                  placeholder="Ex: 3"
                />
              </Field>
            )}
            <Field label="Interesses">
              <div className="flex gap-2 flex-wrap mt-1">
                {INTERESSE_TAGS.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => toggleInteresse(tag.value)}
                    className="px-3 py-1.5 rounded text-xs font-display font-bold text-white transition-opacity cursor-pointer"
                    style={{
                      backgroundColor: tag.bg,
                      opacity: form.interesses.includes(tag.value) ? 1 : 0.3,
                    }}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </Field>
          </section>

          {/* Comercial */}
          <section className="space-y-3">
            <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Comercial</p>
            <Field label="Status">
              <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="">—</option>
                {STATUS_ALL_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Marca">
                <select className="input-field" value={form.marca_interesse} onChange={(e) => set('marca_interesse', e.target.value)}>
                  {MARCAS.map((m) => <option key={m} value={m.toLowerCase()}>{m || '—'}</option>)}
                </select>
              </Field>
              <Field label="Potencial">
                <select className="input-field" value={form.potencial} onChange={(e) => set('potencial', e.target.value)}>
                  <option value="">—</option>
                  <option value="quente">🔥 Quente</option>
                  <option value="morno">Morno</option>
                  <option value="frio">❄ Frio</option>
                </select>
              </Field>
            </div>
            <Field label="Canal de Origem">
              <select className="input-field" value={form.canal_origem} onChange={(e) => set('canal_origem', e.target.value)}>
                <option value="">—</option>
                {CANAL_ORIGEM_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <div>
              <label className="block text-xs font-display font-semibold text-muted uppercase tracking-wide mb-1 flex items-center gap-1.5"><BellRing size={11} className="text-orange"/>Próximo Passo + lembrete</label>
              <input className="input-field" value={form.proximo_passo} onChange={(e) => set('proximo_passo', e.target.value)} placeholder="Ex: Ligar na sexta após 14h"/>
              <input type="date" className="input-field mt-1.5" value={form.data_retorno} onChange={(e) => set('data_retorno', e.target.value)} title="Data do lembrete"/>
            </div>
            {/* Requer Atenção */}
            <div
              onClick={() => set('requer_atencao', !form.requer_atencao)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                form.requer_atencao
                  ? 'border-orange/60 bg-orange/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                form.requer_atencao ? 'border-orange bg-orange' : 'border-muted'
              }`}>
                {form.requer_atencao && <Check size={10} className="text-white" />}
              </div>
              <div>
                <p className="text-xs font-display font-bold text-white">Requer atenção da Ismênia</p>
                <p className="text-xs text-muted mt-0.5">Sinaliza para acompanhamento prioritário</p>
              </div>
            </div>
          </section>

          {/* Observações */}
          <section className="space-y-3">
            <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Observações</p>
            <textarea
              rows={4}
              className="input-field resize-none"
              value={form.observacoes}
              onChange={(e) => set('observacoes', e.target.value)}
            />
          </section>
        </div>
      </div>
    )
  }

  function handleInscrever() {
    if (lead!.status !== 'inscrito') {
      toast.info('Marque o lead como "Inscrito" antes de vinculá-lo a uma turma.')
      return
    }
    navigate('/turmas?inscrever=' + lead!.id)
  }

  /* ── VIEW MODE ── */
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-navy2 flex items-center justify-center shrink-0">
              <span className="font-display font-bold text-base text-white">{initials(lead.nome)}</span>
            </div>
            {lead.requer_atencao && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange rounded-full border-2 border-navy animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-base leading-tight">
              {lead.nome ?? lead.telefone}
            </h2>
            <p className="text-muted text-xs mt-0.5">{lead.empresa_oficina ?? '—'}</p>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {actionSignals.map((signal) => (
                <span
                  key={signal.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold tracking-wide uppercase"
                  style={{ backgroundColor: signal.bg, color: signal.text }}
                >
                  {signal.label}
                </span>
              ))}
              {!hidePrimaryLabel && etiquetaCor && etiquetaLabel && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold tracking-wide uppercase text-white"
                  style={{ backgroundColor: etiquetaCor }}
                >
                  {etiquetaLabel}
                </span>
              )}
              {marca && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold tracking-wide text-white"
                  style={{ backgroundColor: marca.bg }}
                >
                  {marca.label}
                </span>
              )}
              {lead.requer_atencao && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-display font-bold text-orange border border-orange/40 bg-orange/10">
                  <AlertCircle size={10} />
                  Atenção
                </span>
              )}
              {lead.total_interacoes != null && lead.total_interacoes > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-semibold text-muted border border-white/10">
                  {lead.total_interacoes} msg
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1 text-xs btn-secondary px-2.5 py-1.5"
          >
            <Edit2 size={12} />
            Editar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteLead.isPending}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded font-display font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
              confirmDelete
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'btn-secondary text-red-400 hover:text-red-300'
            }`}
            onBlur={() => setConfirmDelete(false)}
          >
            <Trash2 size={12} />
            {confirmDelete ? 'Confirmar' : 'Excluir'}
          </button>
          <button onClick={onClose} className="text-muted hover:text-white cursor-pointer p-1">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 p-4 border-b border-white/10 shrink-0 flex-wrap">
        <a
          href={`tel:${lead.telefone}`}
          className="flex-1 flex items-center justify-center gap-2 btn-secondary text-center"
        >
          <Phone size={15} /> Ligar
        </a>
        <a
          href={`https://wa.me/${lead.telefone?.replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-2 btn-primary text-center"
        >
          <MessageCircle size={15} /> WhatsApp
        </a>
        {lead.conversation_id && (
          <a
            href={`${CHAT_BASE}/app/accounts/1/conversations/${lead.conversation_id}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center justify-center gap-1 btn-secondary px-3"
            title="Ver histórico no Chatwoot"
          >
            <ExternalLink size={15} />
          </a>
        )}
        <button
          onClick={() => setMoveSheetOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 btn-secondary text-center"
        >
          <ArrowRightLeft size={15} /> Mover
        </button>
        <button
          onClick={handleInscrever}
          className="shrink-0 flex items-center justify-center gap-1 btn-secondary px-3"
          title="Inscrever em Turma"
        >
          <GraduationCap size={15} />
        </button>
        {lead.consultor !== 'Paola' && (
          <button
            onClick={handlePassarParaPaola}
            disabled={updateLead.isPending}
            aria-label="Passar este lead para a Paola"
            className="shrink-0 flex items-center gap-1.5 text-xs font-display font-bold text-purple-400 border border-purple-400/40 rounded-lg px-3 py-1.5 hover:border-purple-400/70 transition-colors disabled:opacity-50"
          >
            {updateLead.isPending
              ? <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              : <User size={13} />
            }
            {updateLead.isPending ? 'Passando...' : 'Passar para Paola'}
          </button>
        )}
      </div>

      {/* Data grid */}
      <div className="p-4 space-y-3">
        <InfoRow icon={<Phone size={14} />} label="WhatsApp" value={formatPhone(lead.telefone)} />
        {lead.telefone_oficina && <InfoRow icon={<Phone size={14} />} label="Tel. Oficina" value={lead.telefone_oficina} />}
        {lead.telefone_financeiro && <InfoRow icon={<Phone size={14} />} label="Financeiro / RH" value={lead.telefone_financeiro} />}
        <InfoRow icon={<MapPin size={14} />} label="Cidade" value={lead.cidade && lead.uf ? `${lead.cidade} / ${lead.uf}` : lead.cidade} />
        <InfoRow icon={<Building2 size={14} />} label="Oficina" value={lead.empresa_oficina} />
        <InfoRow icon={<Wrench size={14} />} label="Tipo de Oficina" value={lead.tipo_oficina} />
        <InfoRow icon={<User size={14} />} label="Tipo de Lead" value={
          lead.perfil === 'individual' ? 'Individual'
          : lead.perfil === 'grupo_b2b' ? `Grupo B2B${lead.qtd_interessados ? ` — ${lead.qtd_interessados} pessoas` : ''}`
          : lead.perfil ?? null
        } />
        <InfoRow label="Porte da Oficina" value={
          PORTE_OFICINA_OPTIONS.find((p) => p.value === lead.porte_oficina)?.label ?? lead.porte_oficina
        } />
        <InfoRow icon={<Calendar size={14} />} label="Entrada" value={relativeTime(lead.data_entrada)} />
        {lead.origem === 'visita' && (
          <>
            <InfoRow icon={<Calendar size={14} />} label="Data visita" value={lead.data_visita} />
            <InfoRow icon={<User size={14} />} label="Consultor" value={lead.consultor} />
          </>
        )}
        <InfoRow label="Potencial" value={lead.potencial} />
        {(lead.proximo_passo || lead.data_retorno) && (
          <div className="flex flex-col gap-1.5">
            {lead.proximo_passo && <div className="flex items-start gap-2"><BellRing size={13} className="text-orange mt-0.5 shrink-0"/><p className="text-white/90 text-sm">{lead.proximo_passo}</p></div>}
            {lead.data_retorno && (() => { const today = new Date(); today.setHours(0,0,0,0); const d = new Date(lead.data_retorno + 'T12:00:00'); const vencido = d < today; const urgente = !vencido && (d.getTime()-today.getTime())/86400000<=3; const [,m,dd] = lead.data_retorno.split('-'); return <span className={`self-start text-xs font-display font-bold border rounded px-2 py-0.5 ${vencido?'text-red-400 bg-red-900/20 border-red-400/20':urgente?'text-orange bg-orange/10 border-orange/20':'text-slate-400 bg-white/5 border-white/10'}`}>🔔 {dd}/{m}{vencido?' · VENCIDO':''}</span> })()}
            {lead.data_retorno && (
              <button
                onClick={() => updateLead.mutate({ id: lead.id, data: { data_retorno: null } })}
                className="self-start flex items-center gap-1.5 text-xs font-display font-bold text-green-400 border border-green-400/30 rounded-lg px-3 py-1.5 hover:border-green-400/60 transition-colors bg-green-400/5"
              >
                <Check size={13} />
                Feito — concluir lembrete
              </button>
            )}
          </div>
        )}
        {turma && (
          <InfoRow icon={<GraduationCap size={14} />} label="Turma selecionada" value={
            [turma.nome_treinamento, turma.cidade, turma.data_inicio ? new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : null]
              .filter(Boolean).join(' · ')
          } />
        )}
        <InfoRow label="Canal origem" value={
          lead.canal_origem
            ? (lead.canal_origem === 'whatsapp' ? 'WhatsApp'
              : lead.canal_origem === 'instagram' ? 'Instagram'
              : lead.canal_origem === 'site' ? 'Site'
              : lead.canal_origem === 'indicacao' ? 'Indicação'
              : lead.canal_origem === 'visita' ? 'Visita Presencial'
              : lead.canal_origem)
            : null
        } />
      </div>

      {/* Banner: sugestão de vínculo / criar oficina */}
      {!lead.id_prospecto && (
        <div className="px-4 pb-2">
          <div className="rounded-lg border border-white/20 bg-white/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-display font-semibold text-muted uppercase tracking-wide">
                {prospectoSuggestions.length > 0 ? 'Oficina cadastrada com esse nome — vincular?' : 'Vincular à oficina do banco'}
              </p>
              {!criarOficinaOpen && (
                <button
                  onClick={() => {
                    setCriarOficinaForm({
                      empresa_oficina: lead.empresa_oficina ?? '',
                      cidade: lead.cidade ?? '',
                      uf: lead.uf ?? '',
                      telefone_oficina: '',
                    })
                    setCriarOficinaOpen(true)
                  }}
                  className="text-xs font-display font-bold text-green-400 border border-green-400/30 rounded px-2.5 py-1 hover:border-green-400/60 transition-colors shrink-0"
                >
                  + Criar oficina
                </button>
              )}
            </div>
            {prospectoSuggestions.slice(0, 2).map((p) => (
              <div key={p.id_visita} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-display font-semibold text-white truncate">{p.empresa_oficina}</p>
                  <p className="text-xs text-muted">{p.cidade}{p.uf ? ` / ${p.uf}` : ''}</p>
                </div>
                <button
                  onClick={() => handleLinkProspecto(p)}
                  disabled={updateLead.isPending}
                  className="text-xs font-display font-bold text-orange border border-orange/40 rounded px-2.5 py-1 hover:border-orange/70 transition-colors shrink-0 disabled:opacity-50"
                >
                  Vincular
                </button>
              </div>
            ))}
            {criarOficinaOpen && (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <p className="text-xs text-muted font-display font-semibold">Nova oficina</p>
                <input
                  id="criar-oficina-nome"
                  aria-label="Nome da oficina"
                  className="input-field text-xs"
                  placeholder="Nome da oficina"
                  value={criarOficinaForm.empresa_oficina}
                  onChange={(e) => setCriarOficinaForm(f => ({ ...f, empresa_oficina: e.target.value }))}
                />
                <div className="flex gap-2">
                  <input
                    aria-label="Cidade da oficina"
                    className="input-field text-xs flex-1"
                    placeholder="Cidade"
                    value={criarOficinaForm.cidade}
                    onChange={(e) => setCriarOficinaForm(f => ({ ...f, cidade: e.target.value }))}
                  />
                  <input
                    aria-label="Estado (UF)"
                    className="input-field text-xs w-16"
                    placeholder="UF"
                    maxLength={2}
                    value={criarOficinaForm.uf}
                    onChange={(e) => setCriarOficinaForm(f => ({ ...f, uf: e.target.value.toUpperCase() }))}
                  />
                </div>
                <input
                  aria-label="Telefone da oficina"
                  className="input-field text-xs"
                  placeholder="Telefone da oficina (opcional)"
                  type="tel"
                  value={criarOficinaForm.telefone_oficina}
                  onChange={(e) => setCriarOficinaForm(f => ({ ...f, telefone_oficina: e.target.value }))}
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCriarOficina}
                    disabled={createProspecto.isPending || updateLead.isPending}
                    className="flex-1 btn-primary text-xs py-2"
                  >
                    {createProspecto.isPending ? 'Criando...' : 'Criar e vincular'}
                  </button>
                  <button
                    onClick={() => setCriarOficinaOpen(false)}
                    className="btn-secondary text-xs px-4"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dados da Oficina vinculada */}
      {lead.id_prospecto && prospectoVinculado && (
        <div className="px-4 pb-2">
          <div className="rounded-lg border border-blue-400/20 bg-blue-400/5 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-display font-semibold text-blue-400 uppercase tracking-wide">Oficina Vinculada</p>
              <button
                onClick={() => navigate('/prospectos')}
                className="text-xs font-display font-bold text-blue-400 border border-blue-400/30 rounded px-2.5 py-1 hover:border-blue-400/60 transition-colors"
              >
                Editar oficina →
              </button>
            </div>
            <p className="text-sm font-display font-bold text-white">{prospectoVinculado.empresa_oficina ?? '—'}</p>
            {(prospectoVinculado.cidade || prospectoVinculado.uf) && (
              <p className="text-xs text-muted">{prospectoVinculado.cidade}{prospectoVinculado.uf ? `/${prospectoVinculado.uf}` : ''}</p>
            )}
            {prospectoVinculado.telefone_oficina && (
              <p className="text-xs text-muted">{prospectoVinculado.telefone_oficina}</p>
            )}
            {prospectoVinculado.status_contato && (
              <p className="text-xs text-muted">Status: {prospectoVinculado.status_contato.replace('_', ' ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Empresa / Pagante */}
      <div className="px-4 pb-4">
        <p className="text-xs font-display font-bold text-orange uppercase tracking-wider mb-3">
          Empresa / Pagante
        </p>
        <EmpresaSection
          leadId={lead.id}
          empresaId={lead.empresa_id}
          leadNome={lead.empresa_oficina}
        />
      </div>

      {/* Observações + Timeline */}
      <div className="px-4 pb-4">
        <span className="text-xs font-display font-semibold text-muted uppercase tracking-wide">
          Histórico / Observações
        </span>
        <p className="text-sm text-white/80 whitespace-pre-wrap mt-2 leading-relaxed">
          {lead.observacoes ?? <span className="text-muted italic">Sem observações</span>}
        </p>
      </div>

      {/* Anotação Rápida */}
      <div className="px-4 pb-6">
        <p className="text-xs font-display font-semibold text-orange uppercase tracking-wide mb-2">
          Anotação Rápida
        </p>
        <div className="flex gap-2">
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Digite uma anotação... (Data/Hora/Autor são adicionados automaticamente)"
            rows={2}
            className="input-field resize-none flex-1 text-xs"
          />
          <button
            onClick={handleSaveNota}
            disabled={!nota.trim() || savingNota}
            className="btn-primary px-3 py-2 flex items-center gap-1 self-end"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      <MoverLeadSheet
        leadId={lead.id}
        open={moveSheetOpen}
        onClose={() => setMoveSheetOpen(false)}
      />
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="text-muted mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">
        <p className="text-xs text-muted font-display font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-sm text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}
