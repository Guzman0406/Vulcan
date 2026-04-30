import { useQuery } from '@tanstack/react-query';
import { servicesApi, notificationsApi } from '../services/api';
import { DashboardStats, ServiceRecord, SERVICE_LABELS } from '../types';
import { Users, Wrench, Bell, TrendingUp, Send, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: servicesApi.getDashboard,
    refetchInterval: 60_000,
  });

  const { data: upcoming = [] } = useQuery<ServiceRecord[]>({
    queryKey: ['upcoming'],
    queryFn: servicesApi.getUpcoming,
  });

  const handleRunScheduler = async () => {
    const t = toast.loading('Enviando recordatorios...');
    try {
      await notificationsApi.runScheduler();
      toast.success('Recordatorios enviados', { id: t });
    } catch (e: any) {
      toast.error(e.message, { id: t });
    }
  };

  const statCards = [
    { label: 'Clientes', value: stats?.totalClientes ?? '—', icon: Users, color: 'text-blue-400' },
    { label: 'Servicios este mes', value: stats?.serviciosMes ?? '—', icon: Wrench, color: 'text-brand-500' },
    { label: 'Recordatorios', value: stats?.recordatoriosPendientes ?? '—', icon: Bell, color: 'text-amber-400' },
    {
      label: 'Ingresos mes',
      value: stats ? `$${stats.ingresosMes.toLocaleString('es-MX', { minimumFractionDigits: 0 })}` : '—',
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Panel principal</h1>
        <p className="text-xs text-muted mt-0.5">Resumen del negocio</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <Icon size={16} className={color} strokeWidth={1.5} />
            <div className="text-2xl font-semibold text-white mt-1">{loadingStats ? '—' : value}</div>
            <div className="text-xs text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <Link to="/customers/new" className="btn-primary flex-1 justify-center">
          <Users size={15} /> Nuevo cliente
        </Link>
        <button onClick={handleRunScheduler} className="btn-ghost border border-surface-500">
          <Send size={15} />
          Recordatorios
        </button>
      </div>

      {/* Upcoming services */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Próximos servicios</h2>
            <Link to="/upcoming" className="text-xs text-brand-500 flex items-center gap-0.5">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {upcoming.slice(0, 5).map((record) => {
              const fecha = record.proximo_servicio_estimado ? parseISO(record.proximo_servicio_estimado) : null;
              const urgent = fecha && (isPast(fecha) || isToday(fecha));
              return (
                <div key={record.id} className="card flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">
                      {record.vehicle?.customer?.nombre}
                    </div>
                    <div className="text-xs text-muted truncate">
                      {record.vehicle?.marca} {record.vehicle?.modelo} · {SERVICE_LABELS[record.tipo_servicio]}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {fecha && (
                      <span className={`text-xs font-medium ${urgent ? 'text-red-400' : 'text-amber-400'}`}>
                        {format(fecha, 'd MMM', { locale: es })}
                      </span>
                    )}
                    {!record.recordatorio_enviado && (
                      <div className="text-[10px] text-muted">Sin recordatorio</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
