import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useEmpresaByToken, useUpdateEmpresaByToken } from '@/hooks/useEmpresasCadastradas'
import { useInscritoByToken, useUpdateInscritoByToken } from '@/hooks/useInscritos'
import EmpresaForm from '@/components/empresas/EmpresaForm'
import type { Empresa } from '@/lib/types'

function ParticipanteForm({
  token,
  nomeInicial,
}: {
  token: string
  nomeInicial: string | null
}) {
  const updateMutation = useUpdateInscritoByToken()
  const [form, setForm] = useState({ nome: nomeInicial ?? '', cpf: '', whatsapp: '' })
  const [done, setDone] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await updateMutation.mutateAsync({ token, data: { nome: form.nome, cpf: form.cpf } })
    setDone(true)
  }

  if (done) return <SuccessMessage />

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-300">
        Confirme seus dados para a inscrição no treinamento.
      </p>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
          Nome Completo
        </label>
        <input
          required
          value={form.nome}
          onChange={e => set('nome', e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange/60"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
          CPF
        </label>
        <input
          required
          placeholder="000.000.000-00"
          value={form.cpf}
          onChange={e => set('cpf', e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange/60 font-mono"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
          WhatsApp
        </label>
        <input
          required
          placeholder="47 99999-0001"
          value={form.whatsapp}
          onChange={e => set('whatsapp', e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange/60 font-mono"
        />
      </div>

      <button
        type="submit"
        disabled={updateMutation.isPending}
        className="w-full py-3 rounded-lg bg-orange text-white font-bold text-sm hover:bg-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
        Confirmar dados
      </button>
    </form>
  )
}

function SuccessMessage() {
  return (
    <div className="text-center py-8 space-y-3">
      <CheckCircle size={48} className="mx-auto text-green-400" />
      <p className="text-lg font-bold text-white">Dados recebidos!</p>
      <p className="text-sm text-slate-400">
        Obrigado. Seus dados foram salvos com sucesso.
        Em breve você receberá a confirmação da sua inscrição pelo WhatsApp.
      </p>
    </div>
  )
}

function ErrorMessage() {
  return (
    <div className="text-center py-8 space-y-3">
      <AlertCircle size={48} className="mx-auto text-red-400" />
      <p className="text-lg font-bold text-white">Link inválido</p>
      <p className="text-sm text-slate-400">
        Este link não é válido ou já expirou. Entre em contato via WhatsApp.
      </p>
      <a
        href="https://wa.me/5547989100162"
        className="inline-block mt-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-500 transition-colors"
      >
        Falar no WhatsApp
      </a>
    </div>
  )
}

export default function CadastroPage() {
  const { token } = useParams<{ token: string }>()
  const { data: empresa, isLoading: loadingEmpresa } = useEmpresaByToken(token ?? null)
  const { data: inscrito, isLoading: loadingInscrito } = useInscritoByToken(token ?? null)
  const updateEmpresa = useUpdateEmpresaByToken()
  const [empresaDone, setEmpresaDone] = useState(false)

  const loading = loadingEmpresa || loadingInscrito

  async function handleEmpresaSubmit(data: Partial<Empresa>) {
    if (!token) return
    await updateEmpresa.mutateAsync({ token, data })
    setEmpresaDone(true)
  }

  if (!token) return <Layout><ErrorMessage /></Layout>

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-orange" />
        </div>
      </Layout>
    )
  }

  // Empresa preenchida anteriormente
  if (empresa && (empresaDone || empresa.fill_status === 'preenchido')) {
    return <Layout><SuccessMessage /></Layout>
  }

  // Formulário de empresa
  if (empresa) {
    return (
      <Layout>
        <div className="space-y-4">
          <div>
            <p className="text-lg font-bold text-white">Cadastro da Empresa</p>
            <p className="text-sm text-slate-400 mt-1">
              Olá! Preencha os dados abaixo para confirmar a inscrição no treinamento.
              São poucos campos — leva menos de 2 minutos.
            </p>
          </div>
          <EmpresaForm
            initial={empresa}
            onSubmit={handleEmpresaSubmit}
            loading={updateEmpresa.isPending}
            submitLabel="Enviar dados"
          />
        </div>
      </Layout>
    )
  }

  // Formulário de participante
  if (inscrito) {
    if (inscrito.fill_status === 'preenchido') {
      return <Layout><SuccessMessage /></Layout>
    }
    return (
      <Layout>
        <div className="space-y-4">
          <div>
            <p className="text-lg font-bold text-white">Dados do Participante</p>
            <p className="text-sm text-slate-400 mt-1">
              Confirme seus dados para a inscrição no treinamento Ayala.
            </p>
          </div>
          <ParticipanteForm token={token} nomeInicial={inscrito.nome} />
        </div>
      </Layout>
    )
  }

  return <Layout><ErrorMessage /></Layout>
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D1F3C] flex flex-col items-center justify-start px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange/10 border border-orange/30 mb-4">
            <span className="text-orange font-black text-xl">A</span>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Ayala Treinamentos
          </p>
        </div>
        {/* Card */}
        <div className="bg-[#1A3A6B]/40 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          {children}
        </div>
        <p className="text-center text-xs text-slate-600 mt-6">
          ayalaoficial.com.br · Treinamentos técnicos em linha pesada
        </p>
      </div>
    </div>
  )
}
