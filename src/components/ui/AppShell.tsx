import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Users, KanbanSquare, GraduationCap, ClipboardList, LayoutDashboard, LogOut, DollarSign, BarChart2, Receipt, Building2, Navigation, MessageCircle, RotateCcw, MoreHorizontal, X,
} from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { supabase } from '@/lib/supabase'
import SyncBadge from '@/components/visita/SyncBadge'
import { useProspectosAgendaCount } from '@/hooks/useProspectos'

const NAV_ALL = [
  { to: '/atendimento', label: 'Atendimento', Icon: MessageCircle },
  { to: '/leads',       label: 'Leads',       Icon: Users },
  { to: '/kanban',      label: 'Kanban',      Icon: KanbanSquare },
  { to: '/prospectos',  label: 'Prospectos',  Icon: Building2 },
  { to: '/visita',      label: 'Visita',      Icon: ClipboardList },
  { to: '/roteiro',     label: 'Roteiro',     Icon: Navigation },
  { to: '/turmas',      label: 'Turmas',      Icon: GraduationCap },
  { to: '/dashboard',   label: 'Dashboard',   Icon: LayoutDashboard },
  { to: '/financeiro',  label: 'Financeiro',  Icon: DollarSign },
  { to: '/relatorios',  label: 'Relatórios',  Icon: BarChart2 },
  { to: '/despesas',    label: 'Despesas',    Icon: Receipt },
]

const PRIMARY_PAOLA  = ['/atendimento', '/leads', '/prospectos', '/visita']
const PRIMARY_ISA    = ['/dashboard', '/leads', '/kanban', '/turmas']
const PAOLA_ROUTES   = new Set(['/atendimento', '/leads', '/kanban', '/prospectos', '/visita', '/roteiro', '/turmas', '/dashboard'])

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [userEmail, setUserEmail] = useState('')
  const [maisOpen, setMaisOpen] = useState(false)
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  const { data: agendaCount = 0 } = useProspectosAgendaCount()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
  }, [])

  const isPaola = userEmail === 'paola@ayalaoficial.com.br'
  const visibleNav = isPaola ? NAV_ALL.filter(item => PAOLA_ROUTES.has(item.to)) : NAV_ALL
  const isAtendimento = location.pathname.startsWith('/atendimento')

  const primaryKeys = isPaola ? PRIMARY_PAOLA : PRIMARY_ISA
  const primaryNav  = NAV_ALL.filter(item => primaryKeys.includes(item.to))
  const maisNav     = visibleNav.filter(item => !primaryKeys.includes(item.to))

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function handleRefresh() {
    if (isAtendimento) {
      if (!window.confirm('O Chatwoot será recarregado.\nConversas salvas no servidor não serão perdidas.\n\nAtualizar agora?')) return
    }
    updateServiceWorker(true)
  }

  return (
    <div className="flex flex-col h-screen bg-app overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-footer border-b border-white/10 shrink-0">
        <div className="flex items-center">
          <img
            src="https://s3.ayalaoficial.com.br/logos-ismenia-ayala-treinamentos/ISMENIA-LOGO-RETANG-512X200-TRANSP.png"
            alt="Ayala"
            className="h-8 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.insertAdjacentHTML(
                'afterend',
                '<span class="text-orange font-bold text-sm px-2">Ayala</span>',
              )
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <SyncBadge />
          <button
            onClick={handleRefresh}
            className="relative text-muted hover:text-white transition-colors cursor-pointer"
            aria-label="Atualizar app"
            title={needRefresh ? 'Nova versão disponível — clique para atualizar' : 'Atualizar app'}
          >
            <RotateCcw size={18} />
            {needRefresh && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange animate-pulse" />
            )}
          </button>
          <button
            onClick={handleLogout}
            className="text-muted hover:text-white transition-colors cursor-pointer"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Bottom Nav (mobile) — 5 tabs fixas + "Mais" */}
      <nav className="flex items-stretch bg-footer border-t border-white/10 pb-safe shrink-0 md:hidden print:hidden">
        {primaryNav.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2 flex-1 text-xs font-display font-semibold transition-colors cursor-pointer min-h-[56px] touch-manipulation relative ${
                isActive ? 'text-orange' : 'text-muted hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={22} />
                  {to === '/prospectos' && isPaola && agendaCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[1rem] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {agendaCount > 99 ? '99+' : agendaCount}
                    </span>
                  )}
                </div>
                <span className={isActive ? 'text-orange' : ''}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setMaisOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-2 flex-1 text-xs font-display font-semibold text-muted hover:text-white cursor-pointer min-h-[56px] touch-manipulation"
          aria-label="Mais opções"
        >
          <MoreHorizontal size={22} />
          <span>Mais</span>
        </button>
      </nav>

      {/* Drawer "Mais" (mobile) */}
      {maisOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMaisOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-footer border-t border-white/10 rounded-t-2xl pb-safe md:hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="font-display font-bold text-white text-sm">Mais opções</span>
              <button
                onClick={() => setMaisOpen(false)}
                className="text-muted hover:text-white transition-colors cursor-pointer touch-manipulation p-1"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-4 py-2">
              {maisNav.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMaisOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 py-4 px-2 text-xs font-display font-semibold cursor-pointer touch-manipulation transition-colors ${
                      isActive ? 'text-orange' : 'text-muted hover:text-white'
                    }`
                  }
                >
                  <Icon size={24} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-footer border-r border-white/10 flex-col pt-14 z-20 print:hidden">
        <div className="px-4 py-4 border-b border-white/10 mb-2">
          <img
            src="https://s3.ayalaoficial.com.br/logos-ismenia-ayala-treinamentos/ISMENIA-LOGO-RETANG-512X200-TRANSP.png"
            alt="Ayala"
            className="h-9 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.insertAdjacentHTML(
                'afterend',
                '<span class="text-orange font-bold text-sm px-2">Ayala</span>',
              )
            }}
          />
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {visibleNav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 text-sm font-display font-semibold transition-colors cursor-pointer rounded-lg mx-2 ${
                  isActive
                    ? 'bg-orange/20 text-orange'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
        <div className="shrink-0 border-t border-white/10 pb-4 pt-2 px-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-sm font-display font-semibold text-muted hover:text-white hover:bg-white/5 rounded-lg w-full cursor-pointer transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
    </div>
  )
}
