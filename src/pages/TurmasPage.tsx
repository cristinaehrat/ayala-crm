import { useState } from 'react'
import { useTurmas } from '@/hooks/useTurmas'
import { useInscritos } from '@/hooks/useInscritos'
import TurmaCard from '@/components/turmas/TurmaCard'
import InscritoRow from '@/components/turmas/InscritoRow'
import InscritoModal from '@/components/turmas/InscritoModal'
import type { Inscrito } from '@/lib/types'
import { X, Users, Plus } from 'lucide-react'

export default function TurmasPage() {
  const { data: turmas = [], isLoading } = useTurmas()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: inscritos = [] } = useInscritos(selectedId)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingInscrito, setEditingInscrito] = useState<Inscrito | null>(null)

  const selectedTurma = turmas.find((t) => t.id === selectedId)

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
          <h1 className="font-display font-bold text-white text-lg mb-4">Turmas</h1>
          {turmas.length === 0 && (
            <p className="text-muted text-sm">Nenhuma turma cadastrada.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {turmas.map((turma) => (
              <TurmaCard
                key={turma.id}
                turma={turma}
                active={selectedId === turma.id}
                onClick={() => setSelectedId(turma.id === selectedId ? null : turma.id)}
              />
            ))}
          </div>
        </div>

        {/* Inscritos panel */}
        {selectedId && selectedTurma && (
          <div className="flex flex-col w-full md:w-80 lg:w-96 border-l border-white/10 bg-navy overflow-hidden">
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
                  className="flex items-center gap-1 text-xs btn-primary px-2.5 py-1.5"
                  aria-label="Adicionar inscrito"
                >
                  <Plus size={14} />
                  <span>Novo</span>
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
          </div>
        )}
      </div>

      {selectedId && (
        <InscritoModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          inscrito={editingInscrito}
          turmaId={selectedId}
        />
      )}
    </>
  )
}
