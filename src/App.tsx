import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Toaster } from 'sonner'
import LoginPage from '@/pages/LoginPage'
import LeadsPage from '@/pages/LeadsPage'
import KanbanPage from '@/pages/KanbanPage'
import TurmasPage from '@/pages/TurmasPage'
import VisitaPage from '@/pages/VisitaPage'
import DashboardPage from '@/pages/DashboardPage'
import FinanceiroPage from '@/pages/FinanceiroPage'
import RelatoriosPage from '@/pages/RelatoriosPage'
import DespesasPage from '@/pages/DespesasPage'
import ProspectosPage from '@/pages/ProspectosPage'
import CadastroPage from '@/pages/CadastroPage'
import AppShell from '@/components/ui/AppShell'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1A3A6B', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
        }}
      />
      <Routes>
        <Route path="/cadastro/:token" element={<CadastroPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/leads" replace />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="turmas" element={<TurmasPage />} />
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="visita" element={<VisitaPage />} />
          <Route path="prospectos" element={<ProspectosPage />} />
          <Route path="despesas" element={<DespesasPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
