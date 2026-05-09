import {
  Phone, MessageCircle, ExternalLink, X, User, Building2, MapPin, Calendar, Edit2, Check,
} from 'lucide-react'
import { useLead, useUpdateLead } from '@/hooks/useLeads'
import { ETIQUETA_CORES, ETIQUETA_LABELS, MARCA_BADGES, formatPhone, initials, relativeTime } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { KANBAN_COLUMNS } from '@/lib/types'

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
  canal_origem: string
  observacoes: string
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

export default function LeadDetail({ leadId, onClose }: Props) {
  const { data: lead, isLoading } = useLead(leadId)
  const updateLead = useUpdateLead()
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<EditForm>({
    nome: '', empresa_oficina: '', cidade: '', uf: '', perfil: '',
    status: '', marca_interesse: '', potencial: '', proximo_passo: '',
    canal_origem: '', observacoes: '',
  })

  useEffect(() => {
    if (lead) {
      setForm({
        nome:            lead.nome ?? '',
        empresa_oficina: lead.empresa_oficina ?? '',
        cidade:          lead.cidade ?? '',
        uf:              lead.uf ?? '',
        perfil:          lead.perfil ?? '',
        status:          lead.status ?? '',
        marca_interesse: lead.marca_interesse ?? '',
        potencial:       lead.potencial ?? '',
        proximo_passo:   lead.proximo_passo ?? '',
        canal_origem:    lead.canal_origem ?? '',
        observacoes:     lead.observacoes ?? '',
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

  const etiquetaCor = lead.etiqueta_chatwoot ? ETIQUETA_CORES[lead.etiqueta_chatwoot] : null
  const etiquetaLabel = lead.etiqueta_chatwoot ? ETIQUETA_LABELS[lead.etiqueta_chatwoot] ?? lead.etiqueta_chatwoot : null
  const marca = lead.marca_interesse ? MARCA_BADGES[lead.marca_interesse] : null

  function set(field: keyof EditForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    await updateLead.mutateAsync({
      id: lead!.id,
      data: {
        nome:            form.nome || null,
        empresa_oficina: form.empresa_oficina || null,
        cidade:          form.cidade || null,
        uf:              form.uf || null,
        perfil:          form.perfil || null,
        status:          form.status || null,
        marca_interesse: form.marca_interesse || null,
        potencial:       form.potencial || null,
        proximo_passo:   form.proximo_passo || null,
        canal_origem:    form.canal_origem || null,
        observacoes:     form.observacoes || null,
      },
    })
    toast.success('Lead atualizado')
    setEditMode(false)
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

        <div className="p-4 space-y-4 overflow-y-auto">
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
                <input className="input-field" maxLength={2} value={form.uf} onChange={(e) => set('uf', e.target.value.toUpperCase())} />
              </Field>
            </div>
            <Field label="Perfil">
              <input className="input-field" placeholder="mecânico, gestor de frota..." value={form.perfil} onChange={(e) => set('perfil', e.target.value)} />
            </Field>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Comercial</p>
            <Field label="Status">
              <select className="input-field" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="">—</option>
                {KANBAN_COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Marca">
                <select className="input-field" value={form.marca_interesse} onChange={(e) => set('marca_interesse', e.target.value)}>
                  {MARCAS.map((m) => <option key={m} value={m}>{m || '—'}</option>)}
                </select>
              </Field>
              <Field label="Potencial">
                <input className="input-field" placeholder="baixo, médio, alto" value={form.potencial} onChange={(e) => set('potencial', e.target.value)} />
              </Field>
            </div>
            <Field label="Próximo Passo">
              <input className="input-field" value={form.proximo_passo} onChange={(e) => set('proximo_passo', e.target.value)} />
            </Field>
            <Field label="Canal Origem">
              <input className="input-field" value={form.canal_origem} onChange={(e) => set('canal_origem', e.target.value)} />
            </Field>
          </section>

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

  /* ── VIEW MODE ── */
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-navy2 flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-base text-white">{initials(lead.nome)}</span>
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-base leading-tight">
              {lead.nome ?? lead.telefone}
            </h2>
            <p className="text-muted text-xs mt-0.5">{lead.empresa_oficina ?? '—'}</p>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {etiquetaCor && etiquetaLabel && (
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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1 text-xs btn-secondary px-2.5 py-1.5"
            aria-label="Editar lead"
          >
            <Edit2 size={12} />
            Editar
          </button>
          <button onClick={onClose} className="text-muted hover:text-white cursor-pointer p-1">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 p-4 border-b border-white/10 shrink-0">
        <a
          href={`tel:${lead.telefone}`}
          className="flex-1 flex items-center justify-center gap-2 btn-secondary text-center"
        >
          <Phone size={15} /> Ligar
        </a>
        <a
          href={`https://wa.me/${lead.telefone}`}
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
            className="btn-secondary flex items-center gap-1"
          >
            <ExternalLink size={15} />
          </a>
        )}
      </div>

      {/* Data grid */}
      <div className="p-4 space-y-3">
        <InfoRow icon={<Phone size={14} />} label="Telefone" value={formatPhone(lead.telefone)} />
        <InfoRow icon={<MapPin size={14} />} label="Cidade" value={lead.cidade && lead.uf ? `${lead.cidade} / ${lead.uf}` : lead.cidade} />
        <InfoRow icon={<Building2 size={14} />} label="Oficina" value={lead.empresa_oficina} />
        <InfoRow icon={<User size={14} />} label="Perfil" value={lead.perfil} />
        <InfoRow icon={<Calendar size={14} />} label="Entrada" value={relativeTime(lead.data_entrada)} />
        {lead.origem === 'visita' && (
          <>
            <InfoRow icon={<Calendar size={14} />} label="Data visita" value={lead.data_visita} />
            <InfoRow icon={<User size={14} />} label="Consultor" value={lead.consultor} />
            <InfoRow icon={<Building2 size={14} />} label="Tipo oficina" value={lead.tipo_oficina} />
          </>
        )}
        <InfoRow label="Potencial" value={lead.potencial} />
        <InfoRow label="Próximo passo" value={lead.proximo_passo} />
        <InfoRow label="Canal origem" value={lead.canal_origem} />
      </div>

      {/* Observações */}
      <div className="px-4 pb-6">
        <span className="text-xs font-display font-semibold text-muted uppercase tracking-wide">
          Observações
        </span>
        <p className="text-sm text-white/80 whitespace-pre-wrap mt-2">
          {lead.observacoes ?? <span className="text-muted italic">Sem observações</span>}
        </p>
      </div>
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
