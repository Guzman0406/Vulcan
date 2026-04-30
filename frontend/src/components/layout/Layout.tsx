import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarClock, PlusCircle } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/customers', icon: Users, label: 'Clientes' },
  { to: '/upcoming', icon: CalendarClock, label: 'Próximos' },
  { to: '/services/new', icon: PlusCircle, label: 'Servicio' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-dvh flex flex-col bg-surface-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-900/90 backdrop-blur-sm border-b border-surface-600 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-xs font-bold text-black">V</span>
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">VulcaCRM</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" title="Conectado" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 py-5 pb-24">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — mobile first */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-800/95 backdrop-blur-sm border-t border-surface-600 safe-bottom">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
              >
                <Icon
                  size={20}
                  className={active ? 'text-brand-500' : 'text-zinc-600'}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span className={`text-[10px] font-medium ${active ? 'text-brand-500' : 'text-zinc-600'}`}>
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
