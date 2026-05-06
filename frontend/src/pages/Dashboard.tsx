import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '../services/api';
import { DashboardStats, ServiceRecord, SERVICE_LABELS } from '../types';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: servicesApi.getDashboard,
    refetchInterval: 60_000,
  });

  const { data: upcomingRaw } = useQuery({
    queryKey: ['upcoming'],
    queryFn: servicesApi.getUpcoming,
  });

  const upcoming: ServiceRecord[] = Array.isArray(upcomingRaw) ? upcomingRaw : [];

  return (
    <div className="space-y-stack-lg">
      {/* Greeting */}
      <section>
        <h1 className="text-headline-lg text-on-background">¡Buen día!</h1>
        <p className="text-body-lg text-on-surface-variant mt-1">Resumen de tu día en el taller.</p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-gutter">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md">
          <div className="flex items-center justify-between mb-stack-sm">
            <span className="text-label-lg text-on-surface-variant">Clientes</span>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>group</span>
          </div>
          <div className="text-[32px] font-bold text-on-background leading-tight">
            {loadingStats ? '—' : stats?.totalClientes ?? 0}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md">
          <div className="flex items-center justify-between mb-stack-sm">
            <span className="text-label-lg text-on-surface-variant">Este mes</span>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>build</span>
          </div>
          <div className="text-[32px] font-bold text-on-background leading-tight">
            {loadingStats ? '—' : stats?.serviciosMes ?? 0}
          </div>
        </div>

        <div className="col-span-2 bg-surface-container-lowest border border-secondary-container rounded-xl p-stack-md">
          <div className="flex items-center justify-between mb-stack-sm">
            <span className="text-label-lg text-secondary">Recordatorios pendientes</span>
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: 20 }}>notifications_active</span>
          </div>
          <div className="text-[32px] font-bold text-secondary leading-tight">
            {loadingStats ? '—' : stats?.recordatoriosPendientes ?? 0}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 gap-gutter">
        <Link
          to="/customers/new"
          className="bg-primary text-on-primary text-label-lg rounded-lg h-[56px] flex items-center justify-center gap-2 hover:bg-surface-tint transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person_add</span>
          Nuevo cliente
        </Link>
        <Link
          to="/customers"
          className="bg-surface-container-lowest text-primary text-label-lg rounded-lg h-[56px] flex items-center justify-center gap-2 border border-outline-variant hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
          Buscar cliente
        </Link>
      </section>

      {/* Últimos servicios */}
      {upcoming.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-stack-md">
            <h2 className="text-headline-md text-on-background">Próximos servicios</h2>
            <Link to="/upcoming" className="text-label-lg text-primary">Ver todos</Link>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <ul className="divide-y divide-outline-variant">
              {upcoming.slice(0, 5).map((record) => {
                const fecha = record.proximo_servicio_estimado ? parseISO(record.proximo_servicio_estimado) : null;
                const urgent = fecha && (isPast(fecha) || isToday(fecha));
                const initials = record.vehicle?.customer?.nombre
                  ?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '??';

                return (
                  <li key={record.id} className="flex items-center p-stack-md hover:bg-surface-container-low transition-colors">
                    <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-label-lg mr-stack-md shrink-0">
                      {initials}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-label-lg text-on-background">
                        {record.vehicle?.customer?.nombre}
                      </h3>
                      <p className="text-body-md text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>tire_repair</span>
                        {SERVICE_LABELS[record.tipo_servicio]}
                      </p>
                    </div>
                    <div className="text-right ml-stack-md shrink-0">
                      {fecha && (
                        <span className={`text-label-sm ${urgent ? 'text-error' : 'text-secondary'}`}>
                          {format(fecha, 'd MMM', { locale: es })}
                        </span>
                      )}
                      {!record.recordatorio_enviado && (
                        <div className="text-label-sm text-on-surface-variant">Sin aviso</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}