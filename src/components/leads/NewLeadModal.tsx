import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useCreateLead } from '@/hooks/useLeads'
import { isSuspiciousCity, normalizeCity, toE164 } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
}

const MARCAS = ['', 'Volvo', 'DAF', 'Scania']
const POTENCIAIS = ['', 'baixo', 'medio', 'alto']

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

export default function NewLeadModal({ open, onClose }: Props) {
  const createLead = useCreateLead()

  const [form, setForm] = useState({
    telefone:        '',
    nome:            '',
    empresa_oficina: '',
    cidade:          '',
    uf:              '',
    marca_interesse: '',
    canal_origem:    '',
    potencial:       '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.telefone.trim()) {
      toast.error('Telefone é obrigatório')
      return
    }

    const telefone = toE164(form.telefone)
    if (telefone.length < 10) {
      toast.error('Telefone inválido — use DDD + número')
      return
    }

    const cidade = normalizeCity(form.cidade)
    if (form.cidade.trim() && (!cidade || isSuspiciousCity(form.cidade))) {
      toast.error('Cidade parece inválida. Revise o campo antes de salvar.')
      return
    }

    await createLead.mutateAsync({
      telefone,
      nome:            form.nome || undefined,
      empresa_oficina: form.empresa_oficina || undefined,
      cidade:          cidade || undefined,
      uf:              form.uf || undefined,
      marca_interesse: form.marca_interesse || undefined,
      canal_origem:    form.canal_origem || undefined,
      potencial:       form.potencial || undefined,
    })

    toast.success('Lead criado')
    setForm({ telefone: '', nome: '', empresa_oficina: '', cidade: '', uf: '', marca_interesse: '', canal_origem: '', potencial: '' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Lead">
      <div className="space-y-4">
        {/* Contato */}
        <section className="space-y-3">
          <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Contato</p>
          <Field label="Telefone * (DDD + número)">
            <input
              type="tel"
              className="input-field"
              placeholder="47 9 8910 0162"
              value={form.telefone}
              onChange={(e) => set('telefone', e.target.value)}
            />
          </Field>
          <Field label="Nome">
            <input
              className="input-field"
              placeholder="João Silva"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
            />
          </Field>
        </section>

        {/* Empresa */}
        <section className="space-y-3">
          <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Empresa</p>
          <Field label="Oficina / Empresa">
            <input
              className="input-field"
              placeholder="Auto Mecânica Silva"
              value={form.empresa_oficina}
              onChange={(e) => set('empresa_oficina', e.target.value)}
            />
          </Field>
        </section>

        {/* Localização */}
        <section className="space-y-3">
          <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Localização</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Field label="Cidade">
                <input
                  className="input-field"
                  value={form.cidade}
                  onChange={(e) => set('cidade', e.target.value)}
                />
              </Field>
            </div>
            <Field label="UF">
              <input
                className="input-field"
                maxLength={2}
                placeholder="SC"
                value={form.uf}
                onChange={(e) => set('uf', e.target.value.toUpperCase())}
              />
            </Field>
          </div>
        </section>

        {/* Interesse */}
        <section className="space-y-3">
          <p className="text-xs font-display font-bold text-orange uppercase tracking-wider">Interesse</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Marca">
              <select className="input-field" value={form.marca_interesse} onChange={(e) => set('marca_interesse', e.target.value)}>
                {MARCAS.map((m) => <option key={m} value={m.toLowerCase()}>{m || '—'}</option>)}
              </select>
            </Field>
            <Field label="Potencial">
              <select className="input-field" value={form.potencial} onChange={(e) => set('potencial', e.target.value)}>
                {POTENCIAIS.map((p) => <option key={p} value={p}>{p || '—'}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Canal Origem">
            <input
              className="input-field"
              placeholder="WhatsApp, Indicação, Instagram..."
              value={form.canal_origem}
              onChange={(e) => set('canal_origem', e.target.value)}
            />
          </Field>
        </section>

        <div className="flex gap-3 pt-1">
          <button onClick={handleSave} disabled={createLead.isPending} className="btn-primary flex-1 py-2.5">
            {createLead.isPending ? 'Criando...' : 'Criar Lead'}
          </button>
          <button onClick={onClose} className="btn-secondary px-5">
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  )
}
