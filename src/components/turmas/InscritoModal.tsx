import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { useUpdateInscrito, useCreateInscrito } from '@/hooks/useInscritos'
import type { Inscrito } from '@/lib/types'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  inscrito: Inscrito | null
  turmaId: string
}

const FLUXO_OPTS = [
  { value: '', label: '—' },
  { value: 'link_whatsapp',    label: 'Link WhatsApp' },
  { value: 'boleto_parceiro',  label: 'Boleto Parceiro' },
  { value: 'maquina_presencial', label: 'Máquina Presencial' },
  { value: 'pix_direto',      label: 'PIX Direto' },
]

const CUSTODIA_OPTS = [
  { value: '', label: '—' },
  { value: 'Ayala',    label: 'Ayala' },
  { value: 'Parceiro', label: 'Parceiro' },
]

const STATUS_OPTS = [
  { value: '',           label: '—' },
  { value: 'pago',       label: 'Pago' },
  { value: 'pendente',   label: 'Pendente' },
  { value: 'inadimplente', label: 'Inadimplente' },
]

type Form = {
  nome: string
  empresa_oficina: string
  valor_total: string
  valor_entrada: string
  saldo_a_receber: string
  status_financeiro: string
  forma_pagamento: string
  qtd_parcelas: string
  valor_parcela: string
  fluxo_pagamento: string
  custodia_entrada: string
  comprovante_validado: boolean
  vencimento_1: string
  vencimento_2: string
  vencimento_3: string
  vencimento_4: string
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
    forma_pagamento:       i?.forma_pagamento ?? '',
    qtd_parcelas:          String(i?.qtd_parcelas ?? ''),
    valor_parcela:         String(i?.valor_parcela ?? ''),
    fluxo_pagamento:       i?.fluxo_pagamento ?? '',
    custodia_entrada:      i?.custodia_entrada ?? '',
    comprovante_validado:  i?.comprovante_validado ?? false,
    vencimento_1:          i?.vencimento_1 ?? '',
    vencimento_2:          i?.vencimento_2 ?? '',
    vencimento_3:          i?.vencimento_3 ?? '',
    vencimento_4:          i?.vencimento_4 ?? '',
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

export default function InscritoModal({ open, onClose, inscrito, turmaId }: Props) {
  const [form, setForm] = useState<Form>(() => fromInscrito(inscrito))
  const updateInscrito = useUpdateInscrito()
  const createInscrito = useCreateInscrito()
  const isEdit = !!inscrito

  useEffect(() => {
    if (open) setForm(fromInscrito(inscrito))
  }, [open, inscrito])

  function set(field: keyof Form, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

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
          forma_pagamento:       form.forma_pagamento || null,
          qtd_parcelas:          n(form.qtd_parcelas) ? Math.round(n(form.qtd_parcelas)!) : null,
          valor_parcela:         n(form.valor_parcela),
          fluxo_pagamento:       (form.fluxo_pagamento || null) as Inscrito['fluxo_pagamento'],
          custodia_entrada:      (form.custodia_entrada || null) as Inscrito['custodia_entrada'],
          comprovante_validado:  form.comprovante_validado,
          vencimento_1:          form.vencimento_1 || null,
          vencimento_2:          form.vencimento_2 || null,
          vencimento_3:          form.vencimento_3 || null,
          vencimento_4:          form.vencimento_4 || null,
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

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar Inscrito' : 'Novo Inscrito'}>
      <div className="space-y-5">
        {/* Identificação */}
        <section className="space-y-3">
          <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Identificação</p>
          <Field label="Nome *">
            <input className="input-field" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
          </Field>
          <Field label="Empresa / Oficina">
            <input className="input-field" value={form.empresa_oficina} onChange={(e) => set('empresa_oficina', e.target.value)} />
          </Field>
        </section>

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
              <input type="number" className="input-field" value={form.saldo_a_receber} onChange={(e) => set('saldo_a_receber', e.target.value)} />
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
          <div className="grid grid-cols-2 gap-2">
            <Field label="Forma">
              <input className="input-field" placeholder="PIX, Boleto..." value={form.forma_pagamento} onChange={(e) => set('forma_pagamento', e.target.value)} />
            </Field>
            <Field label="Parcelas">
              <input type="number" min="1" className="input-field" value={form.qtd_parcelas} onChange={(e) => set('qtd_parcelas', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Valor Parcela (R$)">
              <input type="number" className="input-field" value={form.valor_parcela} onChange={(e) => set('valor_parcela', e.target.value)} />
            </Field>
            <Field label="Fluxo Pagamento">
              <select className="input-field" value={form.fluxo_pagamento} onChange={(e) => set('fluxo_pagamento', e.target.value)}>
                {FLUXO_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Custódia Entrada">
              <select className="input-field" value={form.custodia_entrada} onChange={(e) => set('custodia_entrada', e.target.value)}>
                {CUSTODIA_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Comprovante">
              <div className="flex items-center gap-2 h-9 px-3 bg-white/5 border border-white/20 rounded-lg">
                <input
                  type="checkbox"
                  id="comprovante"
                  checked={form.comprovante_validado}
                  onChange={(e) => set('comprovante_validado', e.target.checked)}
                  className="w-4 h-4 accent-orange cursor-pointer"
                />
                <label htmlFor="comprovante" className="text-sm text-white cursor-pointer">Validado</label>
              </div>
            </Field>
          </div>
        </section>

        {/* Vencimentos */}
        <section className="space-y-3">
          <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Vencimentos</p>
          <div className="grid grid-cols-2 gap-2">
            {([1, 2, 3, 4] as const).map((n) => (
              <Field key={n} label={`Vencimento ${n}`}>
                <input
                  type="date"
                  className="input-field"
                  value={form[`vencimento_${n}` as keyof Form] as string}
                  onChange={(e) => set(`vencimento_${n}` as keyof Form, e.target.value)}
                />
              </Field>
            ))}
          </div>
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

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5">
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
