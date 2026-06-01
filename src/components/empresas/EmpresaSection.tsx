import { useState, useEffect } from 'react'
import { Building2, Link2, Plus, Edit2, Send, CheckCircle, X, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  useEmpresaById, useSearchEmpresas, useCreateEmpresa,
  useUpdateEmpresa, useLinkEmpresaToLead,
} from '@/hooks/useEmpresasCadastradas'
import EmpresaForm from './EmpresaForm'
import type { Empresa } from '@/lib/types'

const CRM_URL = 'https://crm.ayalaoficial.com.br'

interface Props {
  leadId: string
  empresaId: string | null
  leadNome: string | null
}

export default function EmpresaSection({ leadId, empresaId, leadNome }: Props) {
  const { data: empresa } = useEmpresaById(empresaId)
  const linkMutation = useLinkEmpresaToLead()
  const createMutation = useCreateEmpresa()
  const updateMutation = useUpdateEmpresa()

  // Auto-gera fill_token assim que a empresa é vinculada, para links funcionarem antes da inscrição
  useEffect(() => {
    if (!empresa || empresa.fill_token) return
    const fillToken = crypto.randomUUID()
    updateMutation.mutateAsync({
      id: empresa.id,
      data: { fill_token: fillToken, fill_status: empresa.fill_status ?? 'pendente' } as Partial<Empresa>,
    }).catch(() => {})
  }, [empresa]) // eslint-disable-line react-hooks/exhaustive-deps

  const [mode, setMode] = useState<'view' | 'search' | 'create' | 'edit'>('view')
  const [query, setQuery] = useState('')
  const { data: searchResults } = useSearchEmpresas(query)

  function buildWhatsappLink(token: string, responsavel: string | null) {
    const formUrl = `${CRM_URL}/cadastro/${token}`
    const msg = encodeURIComponent(
      `Olá${responsavel ? `, ${responsavel.split(' ')[0]}` : ''}! 😊\n\nPara confirmar a inscrição no treinamento, precisamos dos dados da empresa.\n\nPreencha o formulário (leva menos de 2 minutos):\n${formUrl}\n\n_Ayala Treinamentos_`
    )
    return `https://wa.me/?text=${msg}`
  }

  async function handleLink(e: Empresa) {
    await linkMutation.mutateAsync({ leadId, empresaId: e.id })
    setMode('view')
    setQuery('')
    toast.success(`Empresa "${e.nome_fantasia}" vinculada`)
  }

  async function handleUnlink() {
    await linkMutation.mutateAsync({ leadId, empresaId: null })
    toast.success('Empresa desvinculada')
  }

  async function handleCreate(data: Partial<Empresa>) {
    const created = await createMutation.mutateAsync(data as Omit<Empresa, 'id' | 'created_at' | 'updated_at' | 'fill_token' | 'fill_status'>)
    await linkMutation.mutateAsync({ leadId, empresaId: created.id })
    setMode('view')
    toast.success('Empresa criada e vinculada')
  }

  async function handleEdit(data: Partial<Empresa>) {
    if (!empresa) return
    await updateMutation.mutateAsync({ id: empresa.id, data })
    setMode('view')
    toast.success('Empresa atualizada')
  }

  function copiarLinkEmpresa() {
    if (!empresa?.fill_token) return
    const url = `${CRM_URL}/cadastro/${empresa.fill_token}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  function enviarWhatsapp() {
    if (!empresa?.fill_token) return
    window.open(buildWhatsappLink(empresa.fill_token, empresa.nome_responsavel), '_blank')
  }

  // --- VIEW: sem empresa vinculada ---
  if (!empresaId || !empresa) {
    if (mode === 'search') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Vincular Empresa</p>
            <button onClick={() => { setMode('view'); setQuery('') }} className="text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                autoFocus
                placeholder="Nome, razão social ou CNPJ..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange/60"
              />
            </div>
            <button
              onClick={() => setMode('create')}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-orange hover:border-orange/40 text-xs font-bold"
            >
              + Nova
            </button>
          </div>
          {searchResults && searchResults.length > 0 && (
            <div className="space-y-1">
              {searchResults.map(e => (
                <button
                  key={e.id}
                  onClick={() => handleLink(e)}
                  className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange/30 transition-colors"
                >
                  <p className="text-sm text-white font-medium">{e.nome_fantasia}</p>
                  {e.razao_social && <p className="text-xs text-slate-400">{e.razao_social}</p>}
                  {e.cidade && <p className="text-xs text-slate-500">{e.cidade} · {e.estado}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (mode === 'create') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Nova Empresa</p>
            <button onClick={() => setMode('search')} className="text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <EmpresaForm
            initial={{ nome_fantasia: leadNome ?? '' }}
            onSubmit={handleCreate}
            loading={createMutation.isPending}
          />
        </div>
      )
    }

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-dashed border-white/10">
        <Building2 size={16} className="text-slate-500 shrink-0" />
        <span className="text-sm text-slate-500 flex-1">Sem empresa vinculada</span>
        <button
          onClick={() => setMode('search')}
          className="text-xs font-bold text-orange hover:text-orange/80 flex items-center gap-1"
        >
          <Link2 size={12} /> Vincular
        </button>
        <button
          onClick={() => setMode('create')}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1"
        >
          <Plus size={12} /> Nova
        </button>
      </div>
    )
  }

  // --- VIEW: empresa vinculada ---
  if (mode === 'edit') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Editar Empresa</p>
          <button onClick={() => setMode('view')} className="text-slate-500 hover:text-white">
            <X size={14} />
          </button>
        </div>
        <EmpresaForm
          initial={empresa}
          onSubmit={handleEdit}
          loading={updateMutation.isPending}
          submitLabel="Salvar alterações"
        />
      </div>
    )
  }

  const isPj = empresa.tipo === 'pj'
  const preenchido = empresa.fill_status === 'preenchido'

  return (
    <div className="space-y-3">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={14} className="text-orange shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{empresa.nome_fantasia}</p>
            {empresa.razao_social && (
              <p className="text-xs text-slate-400 truncate">{empresa.razao_social}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => setMode('edit')}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10"
            title="Editar empresa"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={handleUnlink}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 border border-white/10"
            title="Desvincular"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Dados */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-slate-500">Tipo</span>
        <span className="text-white font-medium">{isPj ? 'PJ' : 'PF'}</span>

        {isPj && empresa.cnpj && (
          <>
            <span className="text-slate-500">CNPJ</span>
            <span className="text-white font-mono">{empresa.cnpj}</span>
          </>
        )}
        {!isPj && empresa.cpf && (
          <>
            <span className="text-slate-500">CPF</span>
            <span className="text-white font-mono">{empresa.cpf}</span>
          </>
        )}
        {empresa.cidade && (
          <>
            <span className="text-slate-500">Cidade</span>
            <span className="text-white">{empresa.cidade} · {empresa.estado}</span>
          </>
        )}
        {empresa.nome_responsavel && (
          <>
            <span className="text-slate-500">Responsável</span>
            <span className="text-white">{empresa.nome_responsavel}</span>
          </>
        )}
        {empresa.whatsapp_responsavel && (
          <>
            <span className="text-slate-500">WhatsApp</span>
            <span className="text-white font-mono">{empresa.whatsapp_responsavel}</span>
          </>
        )}
      </div>

      {/* Ações: formulário de auto-preenchimento */}
      <div className="border-t border-white/10 pt-3 flex items-center gap-2">
        <div className="flex-1">
          {preenchido ? (
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle size={12} /> Dados preenchidos pela empresa
            </span>
          ) : (
            <span className="text-xs text-slate-500">Formulário ainda não preenchido</span>
          )}
        </div>
        <button
          onClick={copiarLinkEmpresa}
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-slate-300 hover:border-orange/30 hover:text-orange"
        >
          Copiar link
        </button>
        <button
          onClick={enviarWhatsapp}
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-orange/10 border border-orange/30 text-orange hover:bg-orange/20 flex items-center gap-1.5"
        >
          <Send size={11} /> Enviar WPP
        </button>
      </div>
    </div>
  )
}
