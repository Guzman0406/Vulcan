import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, notificationsApi } from '../services/api';
import { Customer, Vehicle, ServiceRecord, SERVICE_LABELS } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getOne(id!),
  });

  const deleteMutation = useMutation({
    mutationFn: () => customersApi.delete(id!),
    onSuccess: () => {
      toast.success('Cliente eliminado');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
  });

  const sendReminder = async (serviceRecordId: string) => {
    const t = toast.loading('Enviando...');
    try {
      const res = await notificationsApi.sendManual(serviceRecordId);
      if (res.success) toast.success(res.message, { id: t });
      else toast.error(res.message, { id: t });
    } catch (e: any) {
      toast.error(e.message, { id: t });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-surface-container rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!customer) return (
    <div className="text-center py-16 text-on-surface-variant text-body-lg">
      Cliente no encontrado
    </div>
  );

  const initials = customer.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-stack-lg pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-touch-target-min h-touch-target-min flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button
          onClick={() => confirm('¿Eliminar este cliente y todos sus registros?') && deleteMutation.mutate()}
          className="w-touch-target-min h-touch-target-min flex items-center justify-center text-error hover:bg-error-container rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>

      {/* Profile */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex items-center gap-stack-md">
        <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[28px] font-bold shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-headline-lg text-on-surface">{customer.nombre}</h1>
          <div className="flex items-center gap-1 text-body-lg text-on-surface-variant mt-1">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>phone</span>
            {customer.telefono}
          </div>
          {customer.email && (
            <div className="flex items-center gap-1 text-body-md text-on-surface-variant mt-0.5">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>mail</span>
              {customer.email}
            </div>
          )}
          <div className="text-label-sm text-on-surface-variant mt-1">
            Cliente desde {format(parseISO(customer.fecha_registro), 'MMMM yyyy', { locale: es })}
          </div>
        </div>
      </div>

      {/* Notas */}
      {customer.notas && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-outline mt-1" style={{ fontSize: 18 }}>notes</span>
            <p className="text-body-md text-on-surface-variant">{customer.notas}</p>
          </div>
        </div>
      )}

      {/* Vehicles */}
      <div className="space-y-stack-md">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: 20 }}>directions_car</span>
            Vehículos
          </h2>
          <Link
            to={`/services/new?customerId=${customer.id}&addVehicle=true`}
            className="text-label-lg text-primary flex items-center gap-1"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Agregar
          </Link>
        </div>

        {!customer.vehicles || customer.vehicles.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-lg text-center text-body-lg text-on-surface-variant">
            Sin vehículos registrados
          </div>
        ) : (
          customer.vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              expanded={expandedVehicle === vehicle.id}
              onToggle={() => setExpandedVehicle(expandedVehicle === vehicle.id ? null : vehicle.id)}
              onSendReminder={sendReminder}
            />
          ))
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant p-margin-mobile z-50 flex gap-stack-md">
        
          href={`https://wa.me/52${customer.telefono}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-[56px] flex items-center justify-center gap-2 text-label-lg text-primary border border-primary rounded-lg hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat</span>
          WhatsApp
        </a>
        <Link
          to={`/services/new?customerId=${customer.id}`}
          className="flex-1 h-[56px] flex items-center justify-center gap-2 text-label-lg bg-primary text-on-primary rounded-lg hover:bg-surface-tint transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_circle</span>
          Registrar servicio
        </Link>
      </div>
    </div>
  );
}

function VehicleCard({ vehicle, expanded, onToggle, onSendReminder }: {
  vehicle: Vehicle;
  expanded: boolean;
  onToggle: () => void;
  onSendReminder: (id: string) => void;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-stack-md hover:bg-surface-container-low transition-colors">
        <div className="flex items-center gap-stack-md">
          <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant">directions_car</span>
          </div>
          <div className="text-left">
            <div className="text-headline-md text-on-surface">{vehicle.marca} {vehicle.modelo}</div>
            <div className="text-body-md text-on-surface-variant">
              {vehicle.año}
              {vehicle.placa && ` · ${vehicle.placa}`}
              {vehicle.color && ` · ${vehicle.color}`}
            </div>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline-variant">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-outline-variant p-stack-md space-y-stack-sm">
          <h3 className="text-label-lg text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>build</span>
            Historial de servicios
          </h3>
          {!vehicle.serviceRecords || vehicle.serviceRecords.length === 0 ? (
            <p className="text-body-md text-on-surface-variant text-center py-4">Sin servicios registrados</p>
          ) : (
            vehicle.serviceRecords.map((record) => (
              <ServiceRow key={record.id} record={record} onSendReminder={onSendReminder} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ServiceRow({ record, onSendReminder }: { record: ServiceRecord; onSendReminder: (id: string) => void }) {
  return (
    <div className="bg-surface-container rounded-lg p-stack-md space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-label-lg text-on-surface">{SERVICE_LABELS[record.tipo_servicio]}</div>
          <div className="text-body-md text-on-surface-variant">
            {format(parseISO(record.fecha_servicio), 'd MMM yyyy', { locale: es })} · ${Number(record.costo).toLocaleString('es-MX')}
          </div>
        </div>
        {record.proximo_servicio_estimado && !record.recordatorio_enviado && (
          <button
            onClick={() => onSendReminder(record.id)}
            className="shrink-0 flex items-center gap-1 text-label-sm text-primary bg-primary-container px-2 py-1 rounded"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>send</span>
            Avisar
          </button>
        )}
      </div>
      {record.proximo_servicio_estimado && (
        <div className="text-label-sm text-secondary flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_today</span>
          Próx: {format(parseISO(record.proximo_servicio_estimado), 'd MMM yyyy', { locale: es })}
          {record.recordatorio_enviado && (
            <span className="ml-2 text-primary flex items-center gap-0.5">
              <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Recordatorio enviado
            </span>
          )}
        </div>
      )}
      {record.descripcion && (
        <div className="text-body-md text-on-surface-variant">{record.descripcion}</div>
      )}
    </div>
  );
}