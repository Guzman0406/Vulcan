import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi, notificationsApi } from '../services/api';
import { ServiceRecord, SERVICE_LABELS } from '../types';
import { Bell, Car, Send, CheckCircle } from 'lucide-react';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function Upcoming() {
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery<ServiceRecord[]>({
    queryKey: ['upcoming'],
    queryFn: servicesApi.getUpcoming,
  });

  const sendReminder = async (id: string) => {
    const t = toast.loading('Enviando recordatorio...');
    try {
      const res = await notificationsApi.sendManual(id);
      if (res.success) {
        toast.success(res.message, { id: t });
        queryClient.invalidateQueries({ queryKey: ['upcoming'] });
      } else {
        toast.error(res.message, { id: t });
      }
    } catch (e: any) {
      toast.error(e.message, { id: t });
    }
  };

  const overdue = records.filter((r) =>
    r.proximo_servicio_estimado && isPast(parseISO(r.proximo_servicio_estimado))
  );
  const upcoming = records.filter((r) =>
    r.proximo_servicio_estimado && !isPast(parseISO(r.proximo_servicio_estimado))
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card h-20 animate-pulse bg-surface-700" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Próximos servicios</h1>
        <p className="text-xs text-muted mt-0.5">Siguientes 30 días · {records.length} pendientes</p>
      </div>

      {records.length === 0 && (
        <div className="text-center py-16 text-muted text-sm">
          No hay servicios programados próximamente
        </div>
      )}

      {overdue.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bell size={12} /> Vencidos ({overdue.length})
          </h2>
          {overdue.map((r) => <RecordCard key={r.id} record={r} onSend={sendReminder} />)}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Car size={12} /> Próximos ({upcoming.length})
          </h2>
          {upcoming.map((r) => <RecordCard key={r.id} record={r} onSend={sendReminder} />)}
        </div>
      )}
    </div>
  );
}

function RecordCard({ record, onSend }: { record: ServiceRecord; onSend: (id: string) => void }) {
  const fecha = record.proximo_servicio_estimado ? parseISO(record.proximo_servicio_estimado) : null;
  const overdue = fecha && isPast(fecha);
  const daysLeft = fecha ? differenceInDays(fecha, new Date()) : null;

  return (
    <div className="card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-white text-sm truncate">
            {record.vehicle?.customer?.nombre}
          </div>
          <div className="text-xs text-muted truncate">
            {record.vehicle?.marca} {record.vehicle?.modelo} · {SERVICE_LABELS[record.tipo_servicio]}
          </div>
        </div>

        <div className="text-right shrink-0">
          {fecha && (
            <div className={`text-xs font-medium ${overdue ? 'text-red-400' : 'text-amber-400'}`}>
              {format(fecha, 'd MMM', { locale: es })}
            </div>
          )}
          {daysLeft !== null && (
            <div className="text-[10px] text-muted">
              {overdue ? `${Math.abs(daysLeft)}d vencido` : daysLeft === 0 ? 'hoy' : `en ${daysLeft}d`}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted">
          {record.vehicle?.customer?.telefono}
        </div>
        {record.recordatorio_enviado ? (
          <span className="flex items-center gap-1 text-[10px] text-brand-500">
            <CheckCircle size={10} /> Recordatorio enviado
          </span>
        ) : (
          <button
            onClick={() => onSend(record.id)}
            className="flex items-center gap-1 text-[10px] text-white bg-brand-500 rounded px-2 py-1"
          >
            <Send size={10} /> Enviar WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
