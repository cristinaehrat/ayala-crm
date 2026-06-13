import { useState, useEffect } from 'react'
import { useFechamentoParceiros } from '@/hooks/useRelatorios'
import CampoManualEditor from '@/components/turma/CampoManualEditor'
import { MARCA_BADGES, formatDate, cn } from '@/lib/utils'
import { ChevronDown, Printer } from 'lucide-react'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function FinanceiroPage() {
  const { data: parceiros = [], isLoading } = useFechamentoParceiros()
  const [openParceiros, setOpenParceiros] = useState<string[]>(['volvo', 'daf', 'scania'])
  const [printMarca, setPrintMarca] = useState<string | null>(null)
  const [printTurmaId, setPrintTurmaId] = useState<string | null>(null)

  useEffect(() => {
    if (!printMarca && !printTurmaId) return
    window.print()
    setPrintMarca(null)
    setPrintTurmaId(null)
  }, [printMarca, printTurmaId])

  function toggleParceiro(marca: string) {
    setOpenParceiros((prev) =>
      prev.includes(marca) ? prev.filter((m) => m !== marca) : [...prev, marca],
    )
  }

  function handlePrintMarca(marca: string) {
    if (!openParceiros.includes(marca)) setOpenParceiros((prev) => [...prev, marca])
    setPrintMarca(marca)
  }

  function handlePrintTurma(turmaId: string, marca: string) {
    if (!openParceiros.includes(marca)) setOpenParceiros((prev) => [...prev, marca])
    setPrintTurmaId(turmaId)
  }

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto md:ml-56 p-4 space-y-4">
        <div className="h-6 w-28 skeleton-pulse rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-5 w-20 skeleton-pulse rounded-full" />
              <div className="h-4 w-24 skeleton-pulse rounded" />
            </div>
            <div className="h-3 w-full skeleton-pulse rounded mt-2" />
            <div className="h-3 w-3/4 skeleton-pulse rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto md:ml-56 p-4 space-y-4">
      <h1 className="font-display font-bold text-navy text-lg print:hidden">Financeiro</h1>

      {parceiros.map((p) => {
        const badge = MARCA_BADGES[p.marca]
        const isOpen = openParceiros.includes(p.marca)
        const isVolvo = p.marca === 'volvo'
        const isDAF = p.marca === 'daf'
        const isScania = p.marca === 'scania'
        const abertas = p.turmas.filter((t) => t.status === 'aberta')
        const emEspera = p.turmas.filter((t) => t.status === 'espera')
        const encerradas = p.turmas.filter((t) => t.status === 'encerrada')
        const totalInscritos = abertas.reduce((s, t) => s + t.qtd_inscritos, 0)
          + emEspera.reduce((s, t) => s + t.qtd_inscritos, 0)
          + encerradas.reduce((s, t) => s + t.qtd_inscritos, 0)

        const isPrintHiddenMarca = printMarca !== null && printMarca !== p.marca
        const isPrintHiddenTurma = printTurmaId !== null

        return (
          <div
            key={p.marca}
            className={cn(
              'section-card overflow-hidden',
              isPrintHiddenMarca ? 'print:hidden' : '',
            )}
          >
            {/* Print header */}
            <div className="hidden print:block px-5 pt-4 pb-2 border-b border-black/10">
              <p className="font-bold text-base">{p.parceiro}</p>
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>

            {/* Accordion header */}
            <div
              className="px-5 py-4 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-slate-50 transition-colors print:hidden"
              onClick={() => toggleParceiro(p.marca)}
            >
              <div className="flex items-center gap-3">
                {badge && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-display font-bold text-white"
                    style={{ backgroundColor: badge.bg }}
                  >
                    {badge.label}
                  </span>
                )}
                <div>
                  <h3 className="font-display font-bold text-navy text-sm">{p.parceiro}</h3>
                  <p className="text-xs text-muted">
                    {p.turmas.length} turma{p.turmas.length !== 1 ? 's' : ''} · {totalInscritos} aluno{totalInscritos !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrintMarca(p.marca) }}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-navy cursor-pointer px-2 py-1 border border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
                >
                  <Printer size={12} />
                  <span>PDF</span>
                </button>
                <ChevronDown
                  size={16}
                  className={cn('text-muted transition-transform duration-200', isOpen ? 'rotate-180' : '')}
                />
              </div>
            </div>

            {/* Conteúdo */}
            <div className={isOpen ? '' : 'hidden print:block'}>

              {/* Turmas Abertas */}
              {abertas.length > 0 && (
                <div className="border-t border-slate-200">
                  <p className="px-5 pt-3 pb-1 text-xs font-display font-semibold text-orange uppercase tracking-wide print:hidden">
                    Abertas
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-4 pt-2">
                    {abertas.map((t) => {
                      const isPrintHiddenThisTurma = isPrintHiddenTurma && printTurmaId !== t.turma_id
                      return (
                        <div
                          key={t.turma_id}
                          className={cn(
                            'bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3',
                            isPrintHiddenThisTurma ? 'print:hidden' : '',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-display font-bold text-navy text-sm leading-tight">{t.nome_turma ?? '—'}</p>
                              <p className="text-xs text-muted mt-0.5">
                                {[t.cidade, formatDate(t.data_inicio)].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                            <button
                              onClick={() => handlePrintTurma(t.turma_id, p.marca)}
                              className="flex items-center gap-1 text-xs text-muted hover:text-navy cursor-pointer px-2 py-1 border border-slate-300 rounded hover:border-slate-400 transition-colors shrink-0 print:hidden"
                            >
                              <Printer size={11} />
                              PDF
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted">Inscritos</p>
                              <p className="font-display font-bold text-navy">{t.qtd_inscritos}</p>
                            </div>
                            <div>
                              <p className="text-muted">Receita Total</p>
                              <p className="font-display font-bold text-navy">{brl(t.receita_total)}</p>
                            </div>
                            {isVolvo && (
                              <>
                                <div>
                                  <p className="text-muted">Entradas Ayala</p>
                                  <p className="font-display font-bold text-green-600">{brl(t.entradas_ayala)}</p>
                                </div>
                                <div>
                                  <p className="text-muted">Acordo (30%)</p>
                                  <p className="font-display font-bold text-orange">{brl(t.receita_total * 0.3)}</p>
                                </div>
                              </>
                            )}
                            {isDAF && (
                              <div>
                                <p className="text-muted">Entradas ({t.qtd_inscritos} × R$300)</p>
                                <p className="font-display font-bold text-green-600">{brl(t.entradas_ayala)}</p>
                              </div>
                            )}
                          </div>

                          {(isDAF || isScania) && (
                            <div className="pt-1 border-t border-slate-200">
                              <CampoManualEditor
                                turmaId={t.turma_id}
                                field={isDAF ? 'valor_recebido_isa_monteiro' : 'valor_recebido_isa_mg'}
                                value={isDAF ? t.valor_recebido_isa_monteiro : t.valor_recebido_isa_mg}
                                label="Recebido Ismênia"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Histórico — Encerradas */}
              {encerradas.length > 0 && (
                <div className="border-t border-slate-200">
                  <p className="px-5 pt-3 pb-1 text-xs font-display font-semibold text-muted uppercase tracking-wide print:hidden">
                    Histórico
                  </p>
                  <div className="divide-y divide-slate-200">
                    {encerradas.map((t) => {
                      const isPrintHiddenThisTurma = isPrintHiddenTurma && printTurmaId !== t.turma_id
                      return (
                        <div
                          key={t.turma_id}
                          className={cn(
                            'px-5 py-3 flex items-start justify-between gap-3',
                            isPrintHiddenThisTurma ? 'print:hidden' : '',
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-display font-semibold text-navy text-xs leading-tight truncate">{t.nome_turma ?? '—'}</p>
                            <p className="text-xs text-muted mt-0.5">
                              {[t.cidade, formatDate(t.data_inicio)].filter(Boolean).join(' · ')}
                            </p>
                            {(isDAF || isScania) && (
                              <div className="mt-1">
                                <CampoManualEditor
                                  turmaId={t.turma_id}
                                  field={isDAF ? 'valor_recebido_isa_monteiro' : 'valor_recebido_isa_mg'}
                                  value={isDAF ? t.valor_recebido_isa_monteiro : t.valor_recebido_isa_mg}
                                  label="Recebido Ismênia"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 shrink-0 text-xs">
                            <span className="text-muted">{t.qtd_inscritos} al.</span>
                            <span className="text-navy font-display font-semibold">{brl(t.receita_total)}</span>
                            {isVolvo && (
                              <span className="text-orange font-display font-bold">{brl(t.receita_total * 0.3)}</span>
                            )}
                            <button
                              onClick={() => handlePrintTurma(t.turma_id, p.marca)}
                              className="text-muted hover:text-navy cursor-pointer transition-colors print:hidden"
                              aria-label="Exportar PDF"
                            >
                              <Printer size={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {p.turmas.length === 0 && (
                <p className="text-center py-6 text-muted text-sm border-t border-slate-200">
                  Nenhuma turma encontrada
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
