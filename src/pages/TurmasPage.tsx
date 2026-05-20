import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTurmas } from '@/hooks/useTurmas'
import { useInscritos } from '@/hooks/useInscritos'
import { useTurmaLeads } from '@/hooks/useTurmaLeads'
import TurmaCard from '@/components/turmas/TurmaCard'
import InscritoRow from '@/components/turmas/InscritoRow'
import InscritoModal from '@/components/turmas/InscritoModal'
import LeadDetailModal from '@/components/leads/LeadDetailModal'
import TurmaRelatorio from '@/components/turmas/TurmaRelatorio'
import TurmaListaChamada from '@/components/turmas/TurmaListaChamada'
import type { Inscrito } from '@/lib/types'
import { X, Users, Plus, GraduationCap, FileText, ClipboardList } from 'lucide-react'

export default function TurmasPage() {
  const [searchParams] = useSearchParams()
  const inscreverLeadId = searchParams.get('inscrever')
  const turmaFromUrl = searchParams.get('turma')

  const { data: turmas = [], isLoading } = useTurmas()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: inscritos = [] } = useInscritos(selectedId)
  const { data: turmaLeads = [] } = useTurmaLeads(selectedId)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingInscrito, setEditingInscrito] = useState<Inscrito | null>(null)
  const [printMode, setPrintMode] = useState(false)
  const [chamadaMode, setChamadaMode] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  useEffect(() => {
    if (turmaFromUrl) setSelectedId(turmaFromUrl)
  }, [turmaFromUrl])

  const selectedTurma = turmas.find((t) => t.id === selectedId)
  const canInscrever = selectedTurma?.status === 'aberta'

  function openCreate() {
    setEditingInscrito(null)
    setModalOpen(true)
  }

  function openEdit(inscrito: Inscrito) {
    setEditingInscrito(inscrito)
    setModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full md:ml-56">
        <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="h-full md:ml-56 flex">
        {/* Turmas grid */}
        <div className={`flex flex-col overflow-y-auto p-4 ${selectedId ? 'hidden md:flex md:flex-1' : 'flex-1'}`}>
          <h1 className="font-display font-bold text-navy text-lg mb-4">Turmas</h1>
          {inscreverLeadId && (
            <div className="flex items-center gap-2 bg-orange/10 border border-orange/30 rounded-xl px-4 py-3 mb-4">
              <GraduationCap size={16} className="text-orange shrink-0" />
              <p className="text-sm text-navy font-display font-semibold">
                Selecione uma turma para inscrever este lead
              </p>
            </div>
          )}
          {turmas.length === 0 && (
            <p className="text-muted text-sm">Nenhuma turma cadastrada.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {turmas.map((turma) => (
              <TurmaCard
                key={turma.id}
                turma={turma}
                active={selectedId === turma.id}
                onClick={() => {
                  const wasSelected = selectedId === turma.id
                  setSelectedId(wasSelected ? null : turma.id)
                  if (!wasSelected && inscreverLeadId && turma.status === 'aberta') {
                    setEditingInscrito(null)
                    setModalOpen(true)
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Inscritos panel */}
        {selectedId && selectedTurma && (
          <div className="flex flex-col w-full md:w-[480px] lg:w-[600px] border-l border-white/10 bg-navy overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
              <div>
                <h2 className="font-display font-bold text-white text-sm">
                  {selectedTurma.nome_treinamento}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Users size={11} className="text-muted" />
                  <span className="text-xs text-muted">{inscritos.length} inscritos</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openCreate}
                  disabled={!canInscrever}
                  className="flex items-center gap-1 text-xs btn-primary px-2.5 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Vincular lead à turma"
                >
                  <Plus size={14} />
                  <span>Vincular Lead</span>
                </button>
                <button
                  onClick={() => setPrintMode(true)}
                  className="text-muted hover:text-white cursor-pointer"
                  aria-label="Relatório Financeiro PDF"
                  title="Relatório Financeiro"
                >
                  <FileText size={16} />
                </button>
                <button
                  onClick={() => setChamadaMode(true)}
                  className="text-muted hover:text-white cursor-pointer"
                  aria-label="Lista de Chamada PDF"
                  title="Lista de Chamada (professor)"
                >
                  <ClipboardList size={16} />
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-muted hover:text-white cursor-pointer"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              {inscritos.length === 0 ? (
                <p className="text-muted text-sm text-center py-8">Nenhum inscrito</p>
              ) : (
                inscritos.map((inscrito) => (
                  <InscritoRow
                    key={inscrito.id_inscricao}
                    inscrito={inscrito}
                    onClick={() => openEdit(inscrito)}
                  />
                ))
              )}
            </div>

            <div className="border-t border-white/10 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display font-bold text-white text-sm">Leads vinculados</h3>
                <span className="text-xs text-muted">{turmaLeads.length}</span>
              </div>
              {turmaLeads.length === 0 ? (
                <p className="text-xs text-muted">Nenhum lead vinculado a esta turma.</p>
              ) : (
                <div className="space-y-2">
                  {turmaLeads.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => setSelectedLeadId(lead.id)}
                      className="w-full text-left rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5 transition-colors"
                    >
                      <p className="text-xs font-display font-semibold text-white truncate">
                        {lead.nome ?? lead.telefone}
                      </p>
                      <p className="text-[11px] text-muted truncate">
                        {lead.empresa_oficina ?? '—'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedId && (
        <InscritoModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          inscrito={editingInscrito}
          turmaId={selectedId}
          leadId={inscreverLeadId}
        />
      )}

      {printMode && selectedTurma && (
        <TurmaRelatorio
          turma={selectedTurma}
          inscritos={inscritos}
          onClose={() => setPrintMode(false)}
        />
      )}

      {chamadaMode && selectedTurma && (
        <TurmaListaChamada
          turma={selectedTurma}
          inscritos={inscritos}
          onClose={() => setChamadaMode(false)}
        />
      )}

      <LeadDetailModal
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />
    </>
  )
}
