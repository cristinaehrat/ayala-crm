import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Users, KanbanSquare, GraduationCap, ClipboardList, LayoutDashboard, LogOut, DollarSign, BarChart2, Receipt, Building2, Navigation, MessageCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import SyncBadge from '@/components/visita/SyncBadge'

const NAV = [
  { to: '/atendimento', label: 'Atendimento', Icon: MessageCircle },
  { to: '/leads',      label: 'Leads',      Icon: Users },
  { to: '/kanban',     label: 'Funil',      Icon: KanbanSquare },
  { to: '/prospectos', label: 'Prospectos', Icon: Building2 },
  { to: '/visita',      label: 'Visita',      Icon: ClipboardList },
  { to: '/roteiro',    label: 'Roteiro',    Icon: Navigation },
  { to: '/turmas',     label: 'Turmas',     Icon: GraduationCap },
  { to: '/dashboard',   label: 'Dashboard',   Icon: LayoutDashboard },
  { to: '/financeiro', label: 'Financeiro', Icon: DollarSign },
  { to: '/relatorios', label: 'Relatórios', Icon: BarChart2 },
  { to: '/despesas',     label: 'Despesas',     Icon: Receipt },
]

const PAOLA_ROUTES = new Set(['/atendimento', '/leads', '/kanban', '/prospectos', '/visita', '/roteiro', '/turmas', '/dashboard'])

export default function AppShell() {
  const navigate = useNavigate()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
  }, [])

  const isPaola = userEmail === 'paola@ayalaoficial.com.br'
  const visibleNav = isPaola ? NAV.filter(item => PAOLA_ROUTES.has(item.to)) : NAV

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
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

      {/* Bottom Nav (mobile) */}
      <nav className="flex items-center overflow-x-auto scrollbar-hide bg-footer border-t border-white/10 pb-safe shrink-0 md:hidden print:hidden">
        {visibleNav.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 text-xs font-display font-semibold transition-colors cursor-pointer shrink-0 min-w-[72px] ${
                isActive ? 'text-orange' : 'text-muted hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

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
        {visibleNav.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-display font-semibold transition-colors cursor-pointer rounded-lg mx-2 ${
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
        <div className="mt-auto pb-4 px-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm font-display font-semibold text-muted hover:text-white hover:bg-white/5 rounded-lg w-full cursor-pointer transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
    </div>
  )
}
