import { Outlet, NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', icon: 'home', label: 'Inicio' },
  { to: '/customers', icon: 'group', label: 'Clientes' },
  { to: '/upcoming', icon: 'calendar_today', label: 'Próximos' },
  { to: '/services/new', icon: 'add_circle', label: 'Servicio' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-outline-variant sticky top-0 z-50">
        <div className="flex items-center justify-between px-margin-mobile h-touch-target-min w-full max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tire_repair</span>
            <span className="text-headline-md font-bold text-primary">VulcaCRM</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500" title="Conectado" />
        </div>
      </header>

      {/* Content */}
      <main className="w-full max-w-3xl mx-auto px-margin-mobile py-stack-lg">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant h-[80px] flex justify-around items-center px-gutter">
        {navItems.map(({ to, icon, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center px-stack-md py-1 rounded-xl transition-colors"
              style={active ? { background: 'var(--tw-color-primary-container, #e6f4ee)' } : {}}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  color: active ? '#00694c' : '#3d4943',
                  fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {icon}
              </span>
              <span
                className="text-label-sm mt-1"
                style={{ color: active ? '#00694c' : '#3d4943' }}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}