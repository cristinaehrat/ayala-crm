import { useState } from 'react'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { db } from '@/lib/dexie'
import { isSuspiciousCity, normalizeCity, toE164, UF_OPTIONS, CONSULTORES } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckCircle, Check, Link2, Search, X, Plus, Trash2, AtSign, Globe } from 'lucide-react'
import { useSearchProspectos, type Prospecto } from '@/hooks/useProspectos'
import { useSearchEmpresas } from '@/hooks/useEmpresasCadastradas'
import type { Empresa } from '@/lib/types'
import { persistProspectoPayload } from '@/lib/prospectos'

const MARCAS = ['Volvo', 'DAF', 'Scania'] as const

const TIPOS_OFICINA = [
  { value: 'mecanica_movel',  label: 'Mecânica Móvel' },
  { value: 'mecatronica',     label: 'Mecatrônica' },
  { value: 'transportadora',  label: 'Transportadora' },
  { value: 'eletrica_diesel', label: 'Elétrica Diesel' },
  { value: 'mecanica_diesel', label: 'Mecânica Diesel' },
  { value: 'diesel_sos',      label: 'Diesel SOS' },
  { value: 'eletro_mecanica', label: 'Eletro-Mecânica' },
  { value: 'outros',          label: 'Outros' },
  { value: 'fora_publico',    label: 'Fora do público-alvo' },
]

const POTENCIAIS = [
  { value: 'alto',          label: 'Alto' },
  { value: 'medio',         label: 'Médio' },
  { value: 'baixo',         label: 'Baixo' },
  { value: 'sem_interesse', label: 'Sem Interesse' },
] as const

const PERFIS = [
  { value: 'individual', label: 'Individual' },
  { value: 'grupo_b2b',  label: 'Grupo B2B' },
] as const

const PORTES = [
  { value: 'pequena', label: 'Pequena (1–3)' },
  { value: 'media',   label: 'Média (4–10)' },
  { value: 'grande',  label: 'Grande (10+)' },
] as const

const PARCEIROS = [
  { value: 'treinatec',  label: 'Treinatec Brasil' },
  { value: 'monteiro',   label: 'Monteiro Eletro Diesel' },
  { value: 'mg_solucoes', label: 'MG Soluções Automotivas' },
] as const

interface VisitaForm {
  empresa_oficina: string
  endereco: string
  telefone_oficina: string
  tipo_oficinas: string[]
  porte_oficina: string
  multimarcas: boolean
  especializacao_oficina: string
  qtd_interessados: string
  nome: string
  telefone: string
  cidade: string
  uf: string
  marcas: string[]
  perfil: string
  potencial: string
  resultado_visita: string
  proximo_passo: string
  data_retorno: string
  consultor: string
  empresa_parceira: string
  observacoes: string
  qualificado_lead: boolean
  participantes: { nome: string; telefone: string }[]
  instagram_handle: string
  facebook_url: string
  website_url: string
}

const EMPTY: VisitaForm = {
  empresa_oficina: '', endereco: '', telefone_oficina: '',
  tipo_oficinas: [], porte_oficina: '', multimarcas: false,
  especializacao_oficina: '', qtd_interessados: '',
  nome: '', telefone: '', cidade: '', uf: '',
  marcas: [], perfil: '', potencial: '',
  resultado_visita: '', proximo_passo: '', data_retorno: '',
  consultor: '', empresa_parceira: '', observacoes: '',
  qualificado_lead: false, participantes: [],
  instagram_handle: '', facebook_url: '', website_url: '',
}

export default function VisitaPage() {
  const [form, setForm] = useState<VisitaForm>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [linkedProspecto, setLinkedProspecto] = useState<Prospecto | null>(null)
  const [linkedEmpresa, setLinkedEmpresa] = useState<Empresa | null>(null)
  const { isOnline } = useOfflineSync()
  const phoneDigits = form.telefone.replace(/\D/g, '')
  const { data: prospectoMatches = [] } = useSearchProspectos(form.empresa_oficina, phoneDigits, form.cidade, form.uf)
  const { data: empresaMatches = [] } = useSearchEmpresas(form.empresa_oficina, phoneDigits, form.cidade, form.uf)

  function set<K extends keyof VisitaForm>(field: K, value: VisitaForm[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleMarca(m: string) {
    setForm(prev => ({
      ...prev,
      marcas: prev.marcas.includes(m)
        ? prev.marcas.filter(x => x !== m)
        : [...prev.marcas, m],
    }))
  }

  function toggleTipoOficina(v: string) {
    setForm(prev => ({
      ...prev,
      tipo_oficinas: prev.tipo_oficinas.includes(v)
        ? prev.tipo_oficinas.filter(x => x !== v)
        : [...prev.tipo_oficinas, v],
    }))
  }

  function fillFromProspecto(p: Prospecto) {
    setLinkedProspecto(p)
    setLinkedEmpresa(null)
    setForm({
      empresa_oficina: p.empresa_oficina ?? '',
      endereco: p.endereco ?? '',
      telefone_oficina: p.telefone_oficina ?? '',
      tipo_oficinas: (p.tipo_oficina ?? '').split(',').map(v => v.trim()).filter(Boolean),
      porte_oficina: p.porte_oficina ?? '',
      multimarcas: p.multimarcas ?? false,
      especializacao_oficina: p.especializacao_oficina ?? '',
      qtd_interessados: p.qtd_interessados ?? '',
      nome: p.nome_responsavel_treinamento ?? p.nome_contato_inicial ?? '',
      telefone: p.whatsapp_responsavel ?? '',
      cidade: p.cidade ?? '',
      uf: p.uf ?? '',
      marcas: (p.marca_interesse ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => value.toLowerCase())
        .map((value) => value === 'volvo' ? 'Volvo' : value === 'daf' ? 'DAF' : value === 'scania' ? 'Scania' : value),
      perfil: p.perfil ?? '',
      potencial: p.potencial ?? '',
      resultado_visita: p.resultado_visita ?? '',
      proximo_passo: p.proximo_passo ?? '',
      data_retorno: p.data_retorno ?? '',
      consultor: p.consultor ?? '',
      empresa_parceira: p.empresa_parceira ?? '',
      observacoes: p.observacoes ?? '',
      qualificado_lead: p.qualificado_lead ?? false,
      participantes: p.participantes ?? [],
      instagram_handle: p.instagram_handle ?? '',
      facebook_url: p.facebook_url ?? '',
      website_url: p.website_url ?? '',
    })
  }

  function fillFromEmpresa(empresa: Empresa) {
    setLinkedEmpresa(empresa)
    setLinkedProspecto(null)
    setForm((prev) => ({
      ...prev,
      empresa_oficina: empresa.nome_fantasia ?? empresa.razao_social ?? prev.empresa_oficina,
      cidade: empresa.cidade ?? prev.cidade,
      uf: empresa.estado ?? prev.uf,
      telefone: empresa.whatsapp_responsavel ?? prev.telefone,
      nome: empresa.nome_responsavel ?? prev.nome,
    }))
  }

  function clearReference() {
    setLinkedProspecto(null)
    setLinkedEmpresa(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const cidade = normalizeCity(form.cidade)
    if (form.cidade.trim() && (!cidade || isSuspiciousCity(form.cidade))) {
      setLoading(false)
      toast.error('Cidade parece inválida. Revise o campo antes de salvar.')
      return
    }

    const foraPublico = form.tipo_oficinas.includes('fora_publico')

    const payload: Record<string, unknown> = {
      ...(linkedProspecto?.id_visita ? { id_visita: linkedProspecto.id_visita } : {}),
      empresa_oficina:              form.empresa_oficina.trim() || null,
      endereco:                     form.endereco.trim() || null,
      telefone_oficina:             form.telefone_oficina.trim() || null,
      nome_responsavel_treinamento: form.nome.trim() || null,
      whatsapp_responsavel:         toE164(form.telefone) || null,
      cidade:                       cidade,
      uf:                           form.uf || null,
      tipo_oficina:                 form.tipo_oficinas.length ? form.tipo_oficinas.join(',') : null,
      porte_oficina:                form.porte_oficina || null,
      marca_interesse:              form.marcas.length ? form.marcas.join(',').toLowerCase() : null,
      potencial:                    foraPublico ? 'sem_interesse' : (form.potencial || null),
      perfil:                       form.perfil || null,
      multimarcas:                  form.multimarcas,
      especializacao_oficina:       form.especializacao_oficina.trim() || null,
      qtd_interessados:             form.qtd_interessados || null,
      resultado_visita:             form.resultado_visita.trim() || null,
      proximo_passo:                form.proximo_passo.trim() || null,
      data_retorno:                 form.data_retorno || null,
      consultor:                    form.consultor.trim() || null,
      empresa_parceira:             form.empresa_parceira || null,
      observacoes:                  form.observacoes.trim() || null,
      canal_origem:                 'visita',
      data_visita:                  new Date().toISOString().split('T')[0],
      empresa_id:                   linkedEmpresa?.id ?? linkedProspecto?.empresa_id ?? null,
      qualificado_lead:             form.qualificado_lead,
      participantes:                form.participantes.filter(p => p.nome.trim() || p.telefone.trim()),
      instagram_handle:             form.instagram_handle.trim() || null,
      facebook_url:                 form.facebook_url.trim() || null,
      website_url:                  form.website_url.trim() || null,
    }

    try {
      if (isOnline) {
        await persistProspectoPayload(payload)
        const msg = form.qualificado_lead
          ? 'Visita registrada e lead qualificado!'
          : 'Visita registrada com sucesso!'
        toast.success(msg)
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
      clearReference()
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
            <h1 className="font-display font-bold text-navy text-lg">Registrar Visita</h1>
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
          <div className="flex items-center gap-2 bg-green-100 border border-green-300 rounded-xl p-3 mb-4">
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            <p className="text-green-700 text-sm font-display font-semibold">Visita registrada!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SEÇÃO 1 — DADOS DA OFICINA */}
          <Section title="Dados da Oficina">
            <Field label="Nome da oficina">
              <input
                type="text"
                value={form.empresa_oficina}
                onChange={(e) => set('empresa_oficina', e.target.value)}
                placeholder="Ex: Oficina Silva e Filhos"
                className="input-field"
              />
            </Field>

            {isOnline && (form.empresa_oficina.trim().length >= 2 || phoneDigits.length >= 8) && (
              <div className="mt-3 space-y-2">
                {(linkedProspecto || linkedEmpresa) && (
                  <div className="flex items-start justify-between gap-2 rounded-xl border border-orange/30 bg-orange/5 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-display font-bold text-orange uppercase tracking-wide">
                        {linkedProspecto ? 'Prospecto existente selecionado' : 'Empresa de referência selecionada'}
                      </p>
                      <p className="text-sm text-navy truncate mt-0.5">
                        {linkedProspecto?.empresa_oficina ?? linkedEmpresa?.nome_fantasia ?? linkedEmpresa?.razao_social ?? '—'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {linkedProspecto
                          ? `${linkedProspecto.cidade ?? 'Sem cidade'}${linkedProspecto.uf ? `/${linkedProspecto.uf}` : ''}${linkedProspecto.whatsapp_responsavel ? ` · ${linkedProspecto.whatsapp_responsavel}` : ''}`
                          : `${linkedEmpresa?.cidade ?? 'Sem cidade'}${linkedEmpresa?.estado ? `/${linkedEmpresa.estado}` : ''}${linkedEmpresa?.cnpj ? ` · ${linkedEmpresa.cnpj}` : ''}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearReference}
                      className="text-slate-500 hover:text-navy cursor-pointer"
                      aria-label="Limpar referência"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {prospectoMatches.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 size={14} className="text-orange" />
                      <p className="text-xs font-display font-bold text-navy uppercase tracking-wide">
                        Prospectos já existentes
                      </p>
                    </div>
                    <div className="space-y-2">
                      {prospectoMatches.map((prospecto) => (
                        <button
                          key={prospecto.id_visita}
                          type="button"
                          onClick={() => fillFromProspecto(prospecto)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-orange/40 hover:bg-orange/5 transition-colors"
                        >
                          <p className="text-sm font-display font-semibold text-navy truncate">
                            {prospecto.empresa_oficina ?? 'Sem oficina'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {(prospecto.nome_responsavel_treinamento ?? prospecto.nome_contato_inicial ?? 'Sem contato')}
                            {prospecto.whatsapp_responsavel ? ` · ${prospecto.whatsapp_responsavel}` : ''}
                            {prospecto.cidade ? ` · ${prospecto.cidade}${prospecto.uf ? `/${prospecto.uf}` : ''}` : ''}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {empresaMatches.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Search size={14} className="text-orange" />
                      <p className="text-xs font-display font-bold text-navy uppercase tracking-wide">
                        Empresas cadastradas
                      </p>
                    </div>
                    <div className="space-y-2">
                      {empresaMatches.map((empresa) => (
                        <button
                          key={empresa.id}
                          type="button"
                          onClick={() => fillFromEmpresa(empresa)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-orange/40 hover:bg-orange/5 transition-colors"
                        >
                          <p className="text-sm font-display font-semibold text-navy truncate">
                            {empresa.nome_fantasia ?? empresa.razao_social ?? 'Sem nome'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {empresa.cnpj ?? 'Sem CNPJ'}
                            {empresa.cidade ? ` · ${empresa.cidade}${empresa.estado ? `/${empresa.estado}` : ''}` : ''}
                            {empresa.whatsapp_responsavel ? ` · ${empresa.whatsapp_responsavel}` : ''}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!linkedProspecto && !linkedEmpresa && (prospectoMatches.length > 0 || empresaMatches.length > 0) && (
                  <p className="text-[11px] text-slate-500">
                    Se nenhuma sugestão for a oficina certa, continue preenchendo normalmente e salve como nova.
                  </p>
                )}
              </div>
            )}

            <Field label="Endereço (rua e número)" className="mt-3">
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => set('endereco', e.target.value)}
                placeholder="Ex: Rua Industrial, 100"
                className="input-field"
              />
            </Field>

            <Field label="Telefone da oficina" className="mt-3">
              <input
                type="tel"
                value={form.telefone_oficina}
                onChange={(e) => set('telefone_oficina', e.target.value)}
                placeholder="(47) 3333-4444"
                className="input-field"
              />
            </Field>

            <Field label="Tipo de oficina" className="mt-3">
              <div className="flex flex-wrap gap-2">
                {TIPOS_OFICINA.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleTipoOficina(t.value)}
                    className={`rounded-lg text-xs font-display font-bold py-2 px-3 transition-colors cursor-pointer border ${
                      form.tipo_oficinas.includes(t.value)
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-slate-300 bg-slate-50 text-navy hover:border-orange/50 hover:bg-orange/5'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Porte da oficina" className="mt-3">
              <div className="grid grid-cols-3 gap-2">
                {PORTES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set('porte_oficina', form.porte_oficina === p.value ? '' : p.value)}
                    className={`rounded-lg text-xs font-display font-bold py-2.5 px-2 transition-colors cursor-pointer border ${
                      form.porte_oficina === p.value
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-slate-300 bg-slate-50 text-navy hover:border-orange/50 hover:bg-orange/5'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="flex items-center gap-3 mt-3 h-12 px-3 bg-white border border-slate-300 rounded-lg">
              <input
                type="checkbox"
                id="multimarcas"
                checked={form.multimarcas}
                onChange={(e) => set('multimarcas', e.target.checked)}
                className="w-4 h-4 accent-orange cursor-pointer"
              />
              <label htmlFor="multimarcas" className="text-sm font-display font-semibold text-navy cursor-pointer">
                Multimarcas
              </label>
            </div>

            <Field label="Especialização da oficina" className="mt-3">
              <input
                type="text"
                value={form.especializacao_oficina}
                onChange={(e) => set('especializacao_oficina', e.target.value)}
                placeholder="Ex: Especializado Mercedes"
                className="input-field"
              />
            </Field>
          </Section>

          {/* SEÇÃO 2 — CONTATO */}
          <Section title="Contato">
            <Field label="Nome do responsável">
              <input
                type="text"
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                placeholder="Nome do contato"
                className="input-field"
              />
            </Field>

            <Field label="Telefone / WhatsApp" className="mt-3">
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => set('telefone', e.target.value)}
                placeholder="(47) 99999-9999"
                className="input-field"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Cidade">
                <input
                  type="text"
                  value={form.cidade}
                  onChange={(e) => set('cidade', e.target.value)}
                  placeholder="Joinville"
                  className="input-field"
                />
              </Field>
              <Field label="UF">
                <select
                  value={form.uf}
                  onChange={(e) => set('uf', e.target.value)}
                  className="input-field"
                >
                  <option value="">UF</option>
                  {UF_OPTIONS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          {/* SEÇÃO 2b — PARTICIPANTES */}
          <Section title="Participantes do treinamento">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted">Técnicos que farão o treinamento</p>
              <button
                type="button"
                onClick={() => set('participantes', [...form.participantes, { nome: '', telefone: '' }])}
                className="flex items-center gap-1 text-xs text-orange font-display font-bold cursor-pointer"
              >
                <Plus size={13} /> Adicionar
              </button>
            </div>
            {form.participantes.length === 0 && (
              <p className="text-xs text-slate-400 italic">Nenhum ainda — clique em Adicionar.</p>
            )}
            <div className="space-y-2">
              {form.participantes.map((pt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="input-field flex-1 text-xs"
                    placeholder="Nome"
                    value={pt.nome}
                    onChange={(e) => {
                      const list = [...form.participantes]
                      list[i] = { ...list[i], nome: e.target.value }
                      set('participantes', list)
                    }}
                  />
                  <input
                    className="input-field flex-1 text-xs"
                    placeholder="WhatsApp"
                    value={pt.telefone}
                    onChange={(e) => {
                      const list = [...form.participantes]
                      list[i] = { ...list[i], telefone: e.target.value }
                      set('participantes', list)
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => set('participantes', form.participantes.filter((_, j) => j !== i))}
                    className="text-slate-400 hover:text-red-400 cursor-pointer shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* SEÇÃO 2c — PRESENÇA DIGITAL */}
          <Section title="Presença Digital">
            <Field label="Instagram (sem @)">
              <div className="relative">
                <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
                <input
                  type="text"
                  value={form.instagram_handle}
                  onChange={(e) => set('instagram_handle', e.target.value.replace(/^@/, ''))}
                  placeholder="mecanicadiesel"
                  className="input-field pl-8"
                />
              </div>
            </Field>
            <Field label="Facebook (URL)" className="mt-3">
              <input
                type="url"
                value={form.facebook_url}
                onChange={(e) => set('facebook_url', e.target.value)}
                placeholder="facebook.com/oficina..."
                className="input-field"
              />
            </Field>
            <Field label="Site (URL)" className="mt-3">
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={form.website_url}
                  onChange={(e) => set('website_url', e.target.value)}
                  placeholder="www.oficina.com.br"
                  className="input-field pl-8"
                />
              </div>
            </Field>
          </Section>

          {/* SEÇÃO 3 — INTERESSE */}
          <Section title="Interesse">
            <Field label="Marca de interesse">
              <div className="flex gap-2">
                {MARCAS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMarca(m)}
                    className={`flex-1 rounded-lg text-sm font-display font-bold transition-colors cursor-pointer border min-h-[48px] ${
                      form.marcas.includes(m)
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-slate-300 bg-slate-50 text-navy hover:border-orange/50 hover:bg-orange/5'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Tipo do lead" className="mt-3">
              <div className="flex gap-2">
                {PERFIS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set('perfil', form.perfil === p.value ? '' : p.value)}
                    className={`flex-1 rounded-lg text-sm font-display font-bold transition-colors cursor-pointer border min-h-[48px] ${
                      form.perfil === p.value
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-slate-300 bg-slate-50 text-navy hover:border-orange/50 hover:bg-orange/5'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>

            {form.perfil === 'grupo_b2b' && (
              <Field label="Qtd. de interessados" className="mt-3">
                <input
                  type="number"
                  value={form.qtd_interessados}
                  onChange={(e) => set('qtd_interessados', e.target.value)}
                  placeholder="Ex: 3"
                  min="1"
                  className="input-field"
                />
              </Field>
            )}

            <Field label="Potencial" className="mt-3">
              <div className="flex gap-2">
                {POTENCIAIS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set('potencial', form.potencial === p.value ? '' : p.value)}
                    className={`flex-1 rounded-lg text-xs font-display font-bold transition-colors cursor-pointer border min-h-[48px] ${
                      form.potencial === p.value
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-slate-300 bg-slate-50 text-navy hover:border-orange/50 hover:bg-orange/5'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {form.tipo_oficinas.includes('fora_publico') && (
                <p className="text-xs text-orange mt-1.5">
                  "Fora do público-alvo" selecionado — potencial será salvo como Sem Interesse.
                </p>
              )}
            </Field>
          </Section>

          {/* SEÇÃO 4 — DETALHES */}
          <Section title="Detalhes (opcional)">
            <Field label="Resultado da visita">
              <textarea
                value={form.resultado_visita}
                onChange={(e) => set('resultado_visita', e.target.value)}
                placeholder="Ex: Muito interesse, pediu proposta"
                rows={3}
                className="input-field resize-none"
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
              <select value={form.consultor} onChange={(e) => set('consultor', e.target.value)} className="input-field">
                <option value="">— Selecione</option>
                {CONSULTORES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Parceiro responsável" className="mt-3">
              <select
                value={form.empresa_parceira}
                onChange={(e) => set('empresa_parceira', e.target.value)}
                className="input-field"
              >
                <option value="">— Selecione</option>
                {PARCEIROS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
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

          {/* SEÇÃO 5 — QUALIFICAÇÃO */}
          <Section title="Qualificação">
            <button
              type="button"
              onClick={() => set('qualificado_lead', !form.qualificado_lead)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                form.qualificado_lead
                  ? 'border-orange bg-orange/10'
                  : 'border-slate-300 bg-slate-50 hover:border-orange/50'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                form.qualificado_lead ? 'border-orange bg-orange' : 'border-slate-400'
              }`}>
                {form.qualificado_lead && <Check size={12} className="text-white" />}
              </div>
              <div className="text-left">
                <p className={`text-sm font-display font-bold ${form.qualificado_lead ? 'text-orange' : 'text-navy'}`}>
                  Qualificar lead agora
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {form.qualificado_lead
                    ? 'Este prospecto será adicionado automaticamente à lista de leads'
                    : 'Marque para promover este prospecto diretamente para o CRM de leads'}
                </p>
              </div>
            </button>
          </Section>

          <button
            type="submit"
            disabled={loading}
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
      <h3 className="font-display font-bold text-xs text-slate-600 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}
