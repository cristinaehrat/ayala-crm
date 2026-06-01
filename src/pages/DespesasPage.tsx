import { useState } from 'react'
import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { useDespesas, useCreateDespesa, useDeleteDespesa, useUpdateDespesa } from '@/hooks/useDespesas'
import { useFaturamentoMes } from '@/hooks/useFinanceiro'
import { useTurmas } from '@/hooks/useTurmas'
import { toast } from 'sonner'
import type { Despesa } from '@/lib/types'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const CATEGORIAS = [
  { value: 'combustivel', label: 'Combustível',  emoji: '⛽', bg: 'bg-orange/80' },
  { value: 'hotel',       label: 'Hotel',         emoji: '🏨', bg: 'bg-blue-600' },
  { value: 'alimentacao', label: 'Alimentação',   emoji: '🍽️', bg: 'bg-green-700' },
  { value: 'marketing',   label: 'Marketing',     emoji: '📣', bg: 'bg-purple-700' },
  { value: 'material',    label: 'Material',      emoji: '📦', bg: 'bg-gray-600' },
  { value: 'manutencao_carro', label: 'Manutenção carro', emoji: '🔧', bg: 'bg-slate-700' },
  { value: 'pedagio',     label: 'Pedágio',       emoji: '🛣️', bg: 'bg-yellow-700' },
  { value: 'airbnb',      label: 'Airbnb',        emoji: '🏠', bg: 'bg-blue-700' },
  { value: 'outros',      label: 'Outros',        emoji: '📎', bg: 'bg-white/20' },
] as const

type CategoriaValue = typeof CATEGORIAS[number]['value']
type FormaPagamento = NonNullable<Despesa['forma_pagamento']>
type ContaBancaria = NonNullable<Despesa['conta_bancaria']>

const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: 'pix',      label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao',   label: 'Cartão' },
]

const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
}

const CONTAS_BANCARIAS: { value: ContaBancaria; label: string }[] = [
  { value: 'nu_pf',     label: 'Nubank PF' },
  { value: 'inter_pf',  label: 'Inter PF' },
  { value: 'sicoob_pf', label: 'Sicoob PF' },
  { value: 'outros',    label: 'Outros' },
]

const CONTA_LABEL: Record<ContaBancaria, string> = {
  nu_pf:     'Nubank PF',
  inter_pf:  'Inter PF',
  sicoob_pf: 'Sicoob PF',
  outros:    'Outros',
}

const CATEGORIA_MAP = Object.fromEntries(CATEGORIAS.map((c) => [c.value, c])) as Record<
  CategoriaValue,
  typeof CATEGORIAS[number]
>

type FiltroMes = 'todos' | 'atual' | 'anterior'

function getMesParam(filtro: FiltroMes): string | undefined {
  if (filtro === 'todos') return undefined
  const now = new Date()
  if (filtro === 'atual') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
}

type SheetForm = {
  data: string
  categoria: CategoriaValue | ''
  descricao: string
  valor: string
  forma_pagamento: FormaPagamento | ''
  conta_bancaria: ContaBancaria | ''
  qtd_parcelas: string
  viagem_referencia: string
  turma_id: string
}

const EMPTY_FORM: SheetForm = {
  data: new Date().toISOString().slice(0, 10),
  categoria: '',
  descricao: '',
  valor: '',
  forma_pagamento: '',
  conta_bancaria: '',
  qtd_parcelas: '',
  viagem_referencia: '',
  turma_id: '',
}

function formatDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export default function DespesasPage() {
  const [filtro, setFiltro] = useState<FiltroMes>('atual')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetForm, setSheetForm] = useState<SheetForm>(EMPTY_FORM)
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null)

  const mes = getMesParam(filtro)
  const { data: despesas = [], isLoading } = useDespesas(mes)
  const { data: faturamento = 0 } = useFaturamentoMes(mes)
  const { data: turmas = [] } = useTurmas()
  const createDespesa = useCreateDespesa()
  const updateDespesa = useUpdateDespesa()
  const deleteDespesa = useDeleteDespesa()

  const total = despesas.reduce((acc, d) => acc + Number(d.valor), 0)
  const resultado = faturamento - total

  function setSF(field: keyof SheetForm, value: string) {
    setSheetForm((f) => ({ ...f, [field]: value }))
  }

  function openSheet() {
    setSheetForm({ ...EMPTY_FORM, data: new Date().toISOString().slice(0, 10) })
    setEditingDespesa(null)
    setSheetOpen(true)
  }

  function openEditSheet(despesa: Despesa) {
    setSheetForm({
      data: despesa.data,
      categoria: CATEGORIAS.some((c) => c.value === despesa.categoria) ? (despesa.categoria as CategoriaValue) : '',
      descricao: despesa.descricao ?? '',
      valor: String(despesa.valor ?? ''),
      forma_pagamento: despesa.forma_pagamento ?? '',
      conta_bancaria: despesa.conta_bancaria ?? '',
      qtd_parcelas: despesa.qtd_parcelas ? String(despesa.qtd_parcelas) : '',
      viagem_referencia: despesa.viagem_referencia ?? '',
      turma_id: despesa.turma_id ?? '',
    })
    setEditingDespesa(despesa)
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
    setEditingDespesa(null)
  }

  async function handleSave() {
    if (!sheetForm.categoria) { toast.error('Selecione uma categoria'); return }
    if (!sheetForm.valor || isNaN(parseFloat(sheetForm.valor))) { toast.error('Informe o valor'); return }
    const qtdParcelas = sheetForm.qtd_parcelas ? parseInt(sheetForm.qtd_parcelas, 10) : null
    if (qtdParcelas !== null && (isNaN(qtdParcelas) || qtdParcelas < 1 || qtdParcelas > 12)) {
      toast.error('Informe parcelas entre 1 e 12')
      return
    }

    const payload: Omit<Despesa, 'id' | 'created_at'> = {
      data: sheetForm.data,
      categoria: sheetForm.categoria,
      descricao: sheetForm.descricao || null,
      valor: parseFloat(sheetForm.valor.replace(',', '.')),
      forma_pagamento: sheetForm.forma_pagamento || null,
      conta_bancaria: sheetForm.conta_bancaria || null,
      qtd_parcelas: qtdParcelas,
      viagem_referencia: sheetForm.viagem_referencia || null,
      turma_id: sheetForm.turma_id || null,
      criado_por: null,
    }

    if (editingDespesa) {
      await updateDespesa.mutateAsync({ id: editingDespesa.id, data: payload })
      toast.success('Despesa atualizada')
    } else {
      await createDespesa.mutateAsync(payload)
      toast.success('Despesa registrada')
    }
    closeSheet()
  }

  async function handleDelete(id: string) {
    await deleteDespesa.mutateAsync(id)
    toast.success('Despesa removida')
  }

  return (
    <>
      <div className="h-full md:ml-56 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display font-bold text-navy text-lg">Despesas</h1>
            <button onClick={openSheet} className="btn-primary flex items-center gap-2 px-4">
              <Plus size={16} /> Nova Despesa
            </button>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {(['todos', 'atual', 'anterior'] as FiltroMes[]).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-semibold border transition-colors cursor-pointer ${
                  filtro === f
                    ? 'bg-orange border-orange text-white'
                    : 'bg-transparent border-slate-300 text-muted hover:text-navy hover:border-orange/50'
                }`}
              >
                {f === 'todos' ? 'Todos' : f === 'atual' ? 'Este Mês' : 'Mês Anterior'}
              </button>
            ))}
          </div>
        </div>

        {/* Strip faturamento / despesas / resultado */}
        {filtro !== 'todos' && (
          <div className="grid grid-cols-3 gap-3 px-4 py-2 shrink-0">
            <div className="section-card p-3 text-center">
              <p className="text-xs text-muted font-display font-semibold uppercase tracking-wide mb-1">Faturamento</p>
              <p className="font-display font-bold text-green-600 text-sm">{brl(faturamento)}</p>
            </div>
            <div className="section-card p-3 text-center">
              <p className="text-xs text-muted font-display font-semibold uppercase tracking-wide mb-1">Despesas</p>
              <p className="font-display font-bold text-red-600 text-sm">{brl(total)}</p>
            </div>
            <div className="section-card p-3 text-center">
              <p className="text-xs text-muted font-display font-semibold uppercase tracking-wide mb-1">Resultado</p>
              <p className={`font-display font-bold text-sm ${resultado >= 0 ? 'text-orange' : 'text-red-400'}`}>
                {brl(resultado)}
              </p>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!isLoading && despesas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt size={32} className="text-muted mb-3" />
              <p className="text-muted text-sm">Nenhuma despesa registrada</p>
            </div>
          )}
          {despesas.map((d) => {
            const cat = CATEGORIA_MAP[d.categoria as CategoriaValue]
            const formaPagamento = d.forma_pagamento ? FORMA_PAGAMENTO_LABEL[d.forma_pagamento] : null
            const contaLabel = d.conta_bancaria ? CONTA_LABEL[d.conta_bancaria] : null
            return (
              <div
                key={d.id}
                className="flex items-start justify-between py-3 border-b border-slate-200 last:border-0"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="text-xs text-muted font-display shrink-0 mt-0.5 w-10">{formatDate(d.data)}</span>
                  <div className="min-w-0">
                    {cat && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-display font-bold text-white ${cat.bg} mb-1`}>
                        {cat.emoji} {cat.label}
                      </span>
                    )}
                    {d.descricao && <p className="text-sm text-navy">{d.descricao}</p>}
                    {d.viagem_referencia && <p className="text-xs text-muted mt-0.5">{d.viagem_referencia}</p>}
                    {(formaPagamento || d.qtd_parcelas || contaLabel) && (
                      <p className="text-xs text-muted mt-0.5">
                        {[
                          formaPagamento,
                          d.qtd_parcelas ? `${d.qtd_parcelas}x` : null,
                          contaLabel,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <p className="text-sm font-display font-bold text-orange">
                    R$ {Number(d.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <button
                    onClick={() => openEditSheet(d)}
                    className="text-muted hover:text-orange transition-colors p-1 cursor-pointer"
                    aria-label="Editar despesa"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    disabled={deleteDespesa.isPending}
                    className="text-muted hover:text-red-400 transition-colors p-1 cursor-pointer disabled:opacity-50"
                    aria-label="Remover despesa"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom sheet nova despesa */}
      {sheetOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={closeSheet} aria-hidden="true" />
          <div className="fixed bottom-0 left-0 right-0 bg-footer border-t border-white/10 rounded-t-2xl z-50 p-4 max-h-[90vh] overflow-y-auto">
            <p className="font-display font-bold text-white text-base mb-4">
              {editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
            </p>

            <div className="space-y-4">
              {/* Data */}
              <div>
                <label className="block text-xs font-display font-semibold text-muted uppercase tracking-wide mb-1">Data</label>
                <input
                  type="date"
                  className="input-field"
                  value={sheetForm.data}
                  onChange={(e) => setSF('data', e.target.value)}
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-display font-semibold text-muted uppercase tracking-wide mb-2">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSF('categoria', value)}
                      className={`px-3 py-2 rounded-lg text-xs font-display font-bold transition-colors cursor-pointer border ${
                        sheetForm.categoria === value
                          ? 'bg-orange border-orange text-white'
                          : 'bg-transparent border-white/20 text-muted hover:border-orange/50 hover:text-white'
                      }`}
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-display font-semibold text-muted uppercase tracking-wide mb-1">Descrição</label>
                <input
                  className="input-field"
                  placeholder="Ex: Posto BR - Chapecó"
                  value={sheetForm.descricao}
                  onChange={(e) => setSF('descricao', e.target.value)}
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs font-display font-semibold text-muted uppercase tracking-wide mb-1">Valor (R$)</label>
                <input
                  inputMode="decimal"
                  className="input-field"
                  placeholder="0,00"
                  value={sheetForm.valor}
                  onChange={(e) => setSF('valor', e.target.value)}
                />
              </div>

              {/* Pagamento */}
              <div>
                <label className="block text-xs font-display font-semibold text-muted uppercase tracking-wide mb-2">Forma de Pagamento</label>
                <div className="flex flex-wrap gap-2">
                  {FORMAS_PAGAMENTO.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSF('forma_pagamento', value)}
                      className={`px-3 py-2 rounded-lg text-xs font-display font-bold transition-colors cursor-pointer border ${
                        sheetForm.forma_pagamento === value
                          ? 'bg-orange border-orange text-white'
                          : 'bg-transparent border-white/20 text-muted hover:border-orange/50 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conta Bancária */}
              <div>
                <label className="block text-xs font-display font-semibold text-muted uppercase tracking-wide mb-2">Conta Debitada</label>
                <div className="flex flex-wrap gap-2">
                  {CONTAS_BANCARIAS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSF('conta_bancaria', sheetForm.conta_bancaria === value ? '' : value)}
                      className={`px-3 py-2 rounded-lg text-xs font-display font-bold transition-colors cursor-pointer border ${
                        sheetForm.conta_bancaria === value
                          ? 'bg-orange border-orange text-white'
                          : 'bg-transparent border-white/20 text-muted hover:border-orange/50 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-semibold text-muted uppercase tracking-wide mb-1">Quantidade de Parcelas</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="input-field"
                  placeholder="1"
                  value={sheetForm.qtd_parcelas}
                  onChange={(e) => setSF('qtd_parcelas', e.target.value)}
                />
              </div>

              {/* Viagem / Referência */}
              <div>
                <label className="block text-xs font-display font-semibold text-muted uppercase tracking-wide mb-1">Viagem / Referência</label>
                <input
                  className="input-field"
                  placeholder="Ex: Chapecó Jun/26"
                  value={sheetForm.viagem_referencia}
                  onChange={(e) => setSF('viagem_referencia', e.target.value)}
                />
              </div>

              {/* Vincular turma */}
              <div>
                <label className="block text-xs font-display font-semibold text-muted uppercase tracking-wide mb-1">Vincular Turma (opcional)</label>
                <select
                  className="input-field"
                  value={sheetForm.turma_id}
                  onChange={(e) => setSF('turma_id', e.target.value)}
                >
                  <option value="">—</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome_treinamento} — {t.cidade}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSave}
                disabled={createDespesa.isPending || updateDespesa.isPending}
                className="btn-primary w-full"
              >
                {createDespesa.isPending || updateDespesa.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
