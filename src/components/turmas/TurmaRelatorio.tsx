import { useEffect } from 'react'
import { X, Printer } from 'lucide-react'
import type { Turma, Inscrito } from '@/lib/types'
import { MARCA_BADGES } from '@/lib/utils'

interface Props {
  turma: Turma
  inscritos: Inscrito[]
  onClose: () => void
}

const brl = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const STATUS_LABEL: Record<string, string> = {
  pago: 'Pago',
  parcial: 'Parcial',
  pendente: 'Pendente',
  inadimplente: 'Inadimplente',
}

const FLUXO_LABEL: Record<string, string> = {
  link_whatsapp: 'Link WA',
  boleto_parceiro: 'Boleto',
  maquina_presencial: 'Máquina',
  pix_direto: 'PIX',
}

function formatFluxo(csv: string | null) {
  if (!csv) return '—'
  return csv.split(',').filter(Boolean).map((v) => FLUXO_LABEL[v] ?? v).join(', ')
}

export default function TurmaRelatorio({ turma, inscritos, onClose }: Props) {
  useEffect(() => {
    window.print()
  }, [])

  const marca = turma.marca ? MARCA_BADGES[turma.marca] : null
  const hoje = new Date().toLocaleDateString('pt-BR')

  return (
    <div className="fixed inset-0 z-50 bg-white text-black overflow-y-auto">
      {/* Toolbar — oculto na impressão */}
      <div className="print:hidden flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50 sticky top-0">
        <p className="font-semibold text-sm text-gray-700">Relatório de Turma</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm font-semibold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <Printer size={14} /> Imprimir / Salvar PDF
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 p-1 cursor-pointer"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Conteúdo imprimível */}
      <div className="p-8 max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6 border-b border-gray-300 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">
                Ayala Treinamentos — Linha Pesada
              </p>
              <h1 className="text-xl font-bold text-gray-900">{turma.nome_treinamento ?? '—'}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                {marca && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: marca.bg }}
                  >
                    {marca.label}
                  </span>
                )}
                {turma.cidade && <span>📍 {turma.cidade}</span>}
                {turma.data_inicio && <span>📅 {formatDate(turma.data_inicio)}{turma.data_fim ? ` a ${formatDate(turma.data_fim)}` : ''}</span>}
                <span className={`font-semibold ${turma.status === 'aberta' ? 'text-green-600' : 'text-gray-500'}`}>
                  {turma.status === 'aberta' ? 'Turma aberta' : 'Turma encerrada'}
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Emitido em {hoje}</p>
              <p className="font-semibold text-gray-700 mt-1">{inscritos.length} inscrito{inscritos.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Tabela resumo */}
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Resumo Financeiro</h2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-3 py-2 border border-gray-200 font-bold">#</th>
                <th className="text-left px-3 py-2 border border-gray-200 font-bold">Nome</th>
                <th className="text-left px-3 py-2 border border-gray-200 font-bold">Empresa</th>
                <th className="text-right px-3 py-2 border border-gray-200 font-bold">Total</th>
                <th className="text-right px-3 py-2 border border-gray-200 font-bold">Entrada</th>
                <th className="text-right px-3 py-2 border border-gray-200 font-bold">Saldo</th>
                <th className="text-center px-3 py-2 border border-gray-200 font-bold">Status</th>
                <th className="text-center px-3 py-2 border border-gray-200 font-bold">Custódia</th>
                <th className="text-center px-3 py-2 border border-gray-200 font-bold">Cobrar Aula</th>
                <th className="text-center px-3 py-2 border border-gray-200 font-bold">Comprov.</th>
              </tr>
            </thead>
            <tbody>
              {inscritos.map((i, idx) => (
                <tr key={i.id_inscricao} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 border border-gray-200 text-gray-500">{idx + 1}</td>
                  <td className="px-3 py-2 border border-gray-200 font-semibold">{i.nome ?? '—'}</td>
                  <td className="px-3 py-2 border border-gray-200 text-gray-600">{i.empresa_oficina ?? '—'}</td>
                  <td className="px-3 py-2 border border-gray-200 text-right">{brl(i.valor_total)}</td>
                  <td className="px-3 py-2 border border-gray-200 text-right">{brl(i.valor_entrada)}</td>
                  <td className={`px-3 py-2 border border-gray-200 text-right font-semibold ${(i.saldo_a_receber ?? 0) > 0 ? 'text-orange-600' : ''}`}>
                    {brl(i.saldo_a_receber)}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-center">
                    {i.status_financeiro ? STATUS_LABEL[i.status_financeiro] ?? i.status_financeiro : '—'}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-center">{i.custodia_entrada ?? '—'}</td>
                  <td className="px-3 py-2 border border-gray-200 text-center">
                    {i.cobrar_em_aula ? <span className="font-bold text-red-600">SIM</span> : 'Não'}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-center">
                    {i.comprovante_validado ? '✓' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-200 font-bold">
                <td colSpan={3} className="px-3 py-2 border border-gray-300">Total</td>
                <td className="px-3 py-2 border border-gray-300 text-right">
                  {brl(inscritos.reduce((s, i) => s + (i.valor_total ?? 0), 0))}
                </td>
                <td className="px-3 py-2 border border-gray-300 text-right">
                  {brl(inscritos.reduce((s, i) => s + (i.valor_entrada ?? 0), 0))}
                </td>
                <td className="px-3 py-2 border border-gray-300 text-right text-orange-700">
                  {brl(inscritos.reduce((s, i) => s + (i.saldo_a_receber ?? 0), 0))}
                </td>
                <td colSpan={4} className="border border-gray-300" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Detalhes por inscrito */}
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Detalhes por Inscrito</h2>
        <div className="space-y-4">
          {inscritos.map((i, idx) => (
            <div key={i.id_inscricao} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-100">
                <span className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-bold text-sm">{i.nome ?? '—'}</p>
                  <p className="text-xs text-gray-500">{i.empresa_oficina ?? '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <div><span className="text-gray-500">Fluxo pagamento:</span> <span className="font-medium">{formatFluxo(i.fluxo_pagamento)}</span></div>
                <div><span className="text-gray-500">Nome pagante NF:</span> <span className="font-medium">{i.pagante_nome_nf || '—'}</span></div>
                <div><span className="text-gray-500">CPF / CNPJ:</span> <span className="font-medium">{i.pagante_documento || '—'}</span></div>
                <div><span className="text-gray-500">E-mail NF:</span> <span className="font-medium">{i.pagante_email_nf || '—'}</span></div>
                {i.observacoes_negociacao && (
                  <div className="col-span-2 mt-1">
                    <span className="text-gray-500">Observações:</span>{' '}
                    <span className="font-medium">{i.observacoes_negociacao}</span>
                  </div>
                )}
                {i.url_comprovante && (
                  <div className="col-span-2 mt-1">
                    <span className="text-gray-500">Comprovante:</span>{' '}
                    <a href={i.url_comprovante} target="_blank" rel="noreferrer" className="text-blue-600 underline print:hidden">Ver anexo</a>
                    <span className="hidden print:inline text-gray-500 text-xs"> (ver link no sistema)</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {inscritos.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum inscrito nesta turma.</p>
          )}
        </div>
      </div>
    </div>
  )
}
