import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import type { Empresa } from '@/lib/types'

interface Props {
  initial?: Partial<Empresa>
  onSubmit: (data: Partial<Empresa>) => Promise<void>
  loading?: boolean
  submitLabel?: string
}

const UF_OPTIONS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA',
  'PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
        placeholder:text-slate-500 focus:outline-none focus:border-orange/60 transition-colors ${props.className ?? ''}`}
    />
  )
}

export default function EmpresaForm({ initial = {}, onSubmit, loading, submitLabel = 'Salvar' }: Props) {
  const [tipo, setTipo] = useState<'pj' | 'pf'>(initial.tipo ?? 'pj')
  const [form, setForm] = useState({
    nome_fantasia: initial.nome_fantasia ?? '',
    razao_social: initial.razao_social ?? '',
    cnpj: initial.cnpj ?? '',
    cpf: initial.cpf ?? '',
    inscricao_estadual: initial.inscricao_estadual ?? '',
    endereco: initial.endereco ?? '',
    bairro: initial.bairro ?? '',
    cep: initial.cep ?? '',
    cidade: initial.cidade ?? '',
    estado: initial.estado ?? '',
    email: initial.email ?? '',
    nome_responsavel: initial.nome_responsavel ?? '',
    whatsapp_responsavel: initial.whatsapp_responsavel ?? '',
  })
  const [cnpjLoading, setCnpjLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function lookupCnpj() {
    const raw = form.cnpj.replace(/\D/g, '')
    if (raw.length !== 14) return
    setCnpjLoading(true)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${raw}`)
      if (!res.ok) throw new Error('CNPJ não encontrado')
      const d = await res.json()
      setForm(f => ({
        ...f,
        razao_social: d.razao_social ?? f.razao_social,
        nome_fantasia: d.nome_fantasia || f.nome_fantasia,
        endereco: [d.logradouro, d.numero].filter(Boolean).join(', '),
        bairro: d.bairro ?? f.bairro,
        cep: d.cep?.replace(/\D/g, '') ?? f.cep,
        cidade: d.municipio ?? f.cidade,
        estado: d.uf ?? f.estado,
        email: d.email ?? f.email,
      }))
    } catch {
      // silently fail — user sees fields empty
    } finally {
      setCnpjLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Partial<Empresa> = { tipo, ...form }
    if (tipo === 'pj') delete (payload as Record<string, unknown>).cpf
    else {
      delete (payload as Record<string, unknown>).cnpj
      delete (payload as Record<string, unknown>).inscricao_estadual
      delete (payload as Record<string, unknown>).razao_social
    }
    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* PJ / PF toggle */}
      <div className="flex gap-2">
        {(['pj', 'pf'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${
              tipo === t
                ? 'bg-orange/10 border-orange text-orange'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-orange/30'
            }`}
          >
            {t === 'pj' ? 'PJ — Pessoa Jurídica' : 'PF — Pessoa Física'}
          </button>
        ))}
      </div>

      {tipo === 'pj' ? (
        <>
          {/* CNPJ com busca automática */}
          <Field label="CNPJ">
            <div className="flex gap-2">
              <Input
                placeholder="00.000.000/0001-00"
                value={form.cnpj}
                onChange={e => set('cnpj', e.target.value)}
                className="flex-1"
              />
              <button
                type="button"
                onClick={lookupCnpj}
                disabled={cnpjLoading}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-orange hover:border-orange/40 transition-colors"
                title="Buscar dados pelo CNPJ"
              >
                {cnpjLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </button>
            </div>
          </Field>
          <Field label="Razão Social">
            <Input value={form.razao_social} onChange={e => set('razao_social', e.target.value)} />
          </Field>
          <Field label="Inscrição Estadual">
            <Input value={form.inscricao_estadual} onChange={e => set('inscricao_estadual', e.target.value)} />
          </Field>
        </>
      ) : (
        <Field label="CPF">
          <Input placeholder="000.000.000-00" value={form.cpf} onChange={e => set('cpf', e.target.value)} />
        </Field>
      )}

      <Field label="Nome Fantasia / Nome">
        <Input
          required
          placeholder={tipo === 'pj' ? 'Como aparece no Google Maps' : 'Nome completo'}
          value={form.nome_fantasia}
          onChange={e => set('nome_fantasia', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Endereço">
          <Input value={form.endereco} onChange={e => set('endereco', e.target.value)} />
        </Field>
        <Field label="Bairro">
          <Input value={form.bairro} onChange={e => set('bairro', e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="CEP">
          <Input value={form.cep} onChange={e => set('cep', e.target.value)} />
        </Field>
        <Field label="Cidade">
          <Input value={form.cidade} onChange={e => set('cidade', e.target.value)} className="col-span-1" />
        </Field>
        <Field label="Estado">
          <select
            value={form.estado}
            onChange={e => set('estado', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange/60"
          >
            <option value="">UF</option>
            {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </Field>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Responsável</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome do Responsável">
            <Input value={form.nome_responsavel} onChange={e => set('nome_responsavel', e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <Input placeholder="47999990001" value={form.whatsapp_responsavel} onChange={e => set('whatsapp_responsavel', e.target.value)} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="E-mail">
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </Field>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-orange text-white font-bold text-sm hover:bg-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {submitLabel}
      </button>
    </form>
  )
}
