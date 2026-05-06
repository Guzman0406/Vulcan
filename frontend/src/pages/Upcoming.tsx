import { useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesApi, notificationsApi } from '../services/api';
import { ServiceRecord, SERVICE_LABELS } from '../types';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function Upcoming() {
  const queryClient = useQueryClient();

  const { data: recordsRaw, isLoading } = useQuery({
    queryKey: ['upcoming'],
    queryFn: servicesApi.getUpcoming,
  });

  const records: ServiceRecord[] = Array.isArray(recordsRaw) ? recordsRaw : [];

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
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[140px] bg-surface-container rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-stack-lg">
      <div>
        <h1 className="text-headline-lg text-on-background">Próximos servicios</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Siguientes 30 días · {records.length} pendientes
        </p>
      </div>

      {records.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: 48 }}>
            calendar_today
          </span>
          <p className="text-body-lg text-on-surface-variant mt-4">
            No hay servicios programados próximamente
          </p>
        </div>
      )}

      {overdue.length > 0 && (
        <div className="space-y-stack-md">
          <h2 className="text-label-lg text-error uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>warning</span>
            Vencidos ({overdue.length})
          </h2>
          {overdue.map((r) => (
            <RecordCard key={r.id} record={r} onSend={sendReminder} />
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-stack-md">
          <h2 className="text-label-lg text-secondary uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_today</span>
            Próximos ({upcoming.length})
          </h2>
          {upcoming.map((r) => (
            <RecordCard key={r.id} record={r} onSend={sendReminder} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecordCard({ record, onSend }: { record: ServiceRecord; onSend: (id: string) => void }) {
  const fecha = record.proximo_servicio_estimado ? parseISO(record.proximo_servicio_estimado) : null;
  const isOverdue = fecha && isPast(fecha);
  const daysLeft = fecha ? differenceInDays(fecha, new Date()) : null;

  return (
    <div className={`bg-surface border rounded-xl p-stack-md flex flex-col gap-stack-md relative overflow-hidden ${isOverdue ? 'border-secondary-container' : 'border-outline-variant'}`}>
      {isOverdue && <div className="absolute top-0 left-0 w-1 h-full bg-secondary-container" />}

      <div className="flex justify-between items-start pl-2">
        <div>
          <h3 className="text-headline-md text-on-surface">{record.vehicle?.customer?.nombre}</h3>
          <div className="flex items-center gap-1 text-body-md text-on-surface-variant mt-1">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>directions_car</span>
            {record.vehicle?.marca} {record.vehicle?.modelo}
          </div>
        </div>
        {fecha && (
          <div className={`text-label-sm px-2 py-1 rounded-md flex items-center gap-1 border ${isOverdue ? 'bg-error-container text-error border-error' : 'bg-surface-container-high text-on-surface border-outline-variant'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              {isOverdue ? 'warning' : 'calendar_today'}
            </span>
            {isOverdue
              ? Math.abs(daysLeft ?? 0) + 'd vencido'
              : daysLeft === 0 ? 'Hoy'
              : 'En ' + daysLeft + 'd'}
          </div>
        )}
      </div>

      <div className="border-t border-outline-variant pt-stack-md flex justify-between items-center pl-2">
        <div>
          <p className="text-label-sm text-on-surface-variant mb-0.5">Servicio</p>
          <p className="text-body-lg text-on-surface">{SERVICE_LABELS[record.tipo_servicio]}</p>
        </div>
        {fecha && (
          <div className="text-right">
            <p className="text-label-sm text-on-surface-variant mb-0.5">Fecha estimada</p>
            <p className={`text-body-lg font-medium ${isOverdue ? 'text-error' : 'text-on-surface'}`}>
              {format(fecha, 'd MMM yyyy', { locale: es })}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 pl-2">
        {record.recordatorio_enviado ? (
          <div className="flex-1 h-12 bg-surface-container-lowest border border-outline-variant text-on-surface-variant rounded-lg flex items-center justify-center gap-2 text-label-lg opacity-80">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            Recordatorio enviado
          </div>
        ) : (
          <button
            onClick={() => onSend(record.id)}
            className="flex-1 h-12 rounded-lg text-label-lg flex items-center justify-center gap-2 text-white transition-colors"
            style={{ backgroundColor: '#25D366' }}
          >
            <svg className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            Enviar WhatsApp
          </button>
        )}
        <a
          href={"tel:" + record.vehicle?.customer?.telefono}
          className="w-12 h-12 bg-surface text-primary border border-outline-variant rounded-lg flex items-center justify-center hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>call</span>
        </a>
      </div>
    </div>
  );
}