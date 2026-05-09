import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Users, KanbanSquare, GraduationCap, ClipboardList, LayoutDashboard, LogOut, DollarSign,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import SyncBadge from '@/components/visita/SyncBadge'

const NAV = [
  { to: '/leads',      label: 'Leads',      Icon: Users },
  { to: '/kanban',     label: 'Funil',      Icon: KanbanSquare },
  { to: '/turmas',     label: 'Turmas',     Icon: GraduationCap },
  { to: '/financeiro', label: 'Financeiro', Icon: DollarSign },
  { to: '/visita',     label: 'Visita',     Icon: ClipboardList },
  { to: '/dashboard',  label: 'Dashboard',  Icon: LayoutDashboard },
]

export default function AppShell() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-screen bg-navy overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-footer border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange flex items-center justify-center">
            <span className="text-white font-display font-bold text-xs">A</span>
          </div>
          <span className="font-display font-bold text-sm text-white tracking-wide">Ayala CRM</span>
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
      <nav className="flex items-center justify-around bg-footer border-t border-white/10 pb-safe shrink-0 md:hidden">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-2 text-xs font-display font-semibold transition-colors cursor-pointer ${
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
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 bg-footer border-r border-white/10 flex-col pt-14 z-20">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10 mb-2">
          <div className="w-8 h-8 rounded-full bg-orange flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">A</span>
          </div>
          <span className="font-display font-bold text-white">Ayala CRM</span>
        </div>
        {NAV.map(({ to, label, Icon }) => (
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
