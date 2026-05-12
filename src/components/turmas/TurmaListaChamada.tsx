import { useEffect, useState } from 'react'
import { X, Printer, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Turma, Inscrito } from '@/lib/types'

interface Props {
  turma: Turma
  inscritos: Inscrito[]
  onClose: () => void
}

const FLUXO_LABEL: Record<string, string> = {
  link_whatsapp:      'Link WA',
  boleto_parceiro:    'Boleto',
  maquina_presencial: 'Máquina',
  pix_direto:         'PIX',
}

function formatFluxo(csv: string | null, fallback: string | null) {
  if (csv) {
    const labels = csv.split(',').filter(Boolean).map((v) => FLUXO_LABEL[v] ?? v)
    if (labels.length > 0) return labels.join(', ')
  }
  return fallback || '—'
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function TurmaListaChamada({ turma, inscritos, onClose }: Props) {
  const [telefones, setTelefones] = useState<Record<string, string>>({})
  const hoje = new Date().toLocaleDateString('pt-BR')

  // Buscar telefones dos leads
  useEffect(() => {
    const ids = inscritos.map((i) => i.id_lead).filter(Boolean) as string[]
    if (ids.length === 0) return
    supabase
      .from('leads_v2')
      .select('id,telefone')
      .in('id', ids)
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, string> = {}
        for (const l of data) map[l.id] = l.telefone ?? ''
        setTelefones(map)
      })
  }, [inscritos])

  useEffect(() => {
    window.print()
  }, [])

  const cobrarCount = inscritos.filter((i) => i.cobrar_em_aula).length

  return (
    <div className="fixed inset-0 z-50 bg-white text-black overflow-y-auto">
      {/* Toolbar — oculto na impressão */}
      <div className="print:hidden flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50 sticky top-0">
        <p className="font-semibold text-sm text-gray-700">Lista de Chamada</p>
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
      <div className="p-8 max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6 border-b border-gray-300 pb-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">
            Ayala Treinamentos — Lista de Chamada
          </p>
          <h1 className="text-xl font-bold text-gray-900">{turma.nome_treinamento ?? '—'}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
            {turma.cidade && <span>Local: <strong>{turma.cidade}</strong></span>}
            {turma.data_inicio && (
              <span>
                Data: <strong>{formatDate(turma.data_inicio)}{turma.data_fim ? ` a ${formatDate(turma.data_fim)}` : ''}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-6 mt-2 text-xs text-gray-500">
            <span>Emitido em {hoje}</span>
            <span className="font-semibold text-gray-700">{inscritos.length} inscrito{inscritos.length !== 1 ? 's' : ''}</span>
            {cobrarCount > 0 && (
              <span className="flex items-center gap-1 text-red-600 font-bold">
                <AlertCircle size={12} /> {cobrarCount} a cobrar em aula
              </span>
            )}
          </div>
        </div>

        {/* Tabela */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-3 py-2 border border-gray-200 font-bold w-8">#</th>
              <th className="text-left px-3 py-2 border border-gray-200 font-bold">Nome</th>
              <th className="text-left px-3 py-2 border border-gray-200 font-bold">Telefone</th>
              <th className="text-left px-3 py-2 border border-gray-200 font-bold">Forma Pgto</th>
              <th className="text-center px-3 py-2 border border-gray-200 font-bold">Cobrar em Aula</th>
            </tr>
          </thead>
          <tbody>
            {inscritos.map((i, idx) => {
              const cobrar = i.cobrar_em_aula === true
              const tel = i.id_lead ? (telefones[i.id_lead] ?? '') : ''
              return (
                <tr
                  key={i.id_inscricao}
                  className={cobrar ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-3 py-2 border border-gray-200 text-gray-500 text-center">{idx + 1}</td>
                  <td className="px-3 py-2 border border-gray-200 font-semibold">
                    {i.nome ?? '—'}
                    {i.empresa_oficina && (
                      <p className="text-xs font-normal text-gray-500">{i.empresa_oficina}</p>
                    )}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 font-mono text-xs">{tel || '—'}</td>
                  <td className="px-3 py-2 border border-gray-200 text-xs">
                    {formatFluxo(i.fluxo_pagamento, i.forma_pagamento)}
                  </td>
                  <td className="px-3 py-2 border border-gray-200 text-center">
                    {cobrar ? (
                      <span className="inline-flex items-center gap-1 font-bold text-red-700 text-xs">
                        <AlertCircle size={12} /> COBRAR
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {inscritos.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500 border border-gray-200">
                  Nenhum inscrito nesta turma.
                </td>
              </tr>
            </tbody>
          )}
        </table>

        {cobrarCount > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <strong>Atenção instrutor:</strong> {cobrarCount} aluno{cobrarCount !== 1 ? 's' : ''} {cobrarCount !== 1 ? 'devem' : 'deve'} ter o pagamento cobrado no local no primeiro dia do treinamento.
          </div>
        )}
      </div>
    </div>
  )
}
