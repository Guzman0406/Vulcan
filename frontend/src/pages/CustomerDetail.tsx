import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, notificationsApi } from '../services/api';
import { Customer, Vehicle, ServiceRecord, SERVICE_LABELS } from '../types';
import {
  ArrowLeft, Phone, Car, Wrench, Plus, Send, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
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
        <div className="h-8 w-32 bg-surface-700 rounded animate-pulse" />
        <div className="card h-24 animate-pulse bg-surface-700" />
        <div className="card h-48 animate-pulse bg-surface-700" />
      </div>
    );
  }

  if (!customer) return <div className="text-muted text-sm">Cliente no encontrado</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-white truncate">{customer.nombre}</h1>
          <div className="flex items-center gap-1 text-xs text-muted">
            <Phone size={10} /> {customer.telefono}
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm('¿Eliminar este cliente y todos sus registros?')) {
              deleteMutation.mutate();
            }
          }}
          className="btn-danger p-2"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Info card */}
      <div className="card space-y-2">
        {customer.email && (
          <div className="text-xs text-muted">
            <span className="text-zinc-500">Email:</span> {customer.email}
          </div>
        )}
        {customer.notas && (
          <div className="text-xs text-zinc-400 bg-surface-700 rounded-lg p-3">
            {customer.notas}
          </div>
        )}
        <div className="text-xs text-muted">
          Cliente desde {format(parseISO(customer.fecha_registro), 'MMMM yyyy', { locale: es })}
        </div>
      </div>

      {/* Add service link */}
      <Link
        to={`/services/new?customerId=${customer.id}`}
        className="btn-primary w-full justify-center"
      >
        <Plus size={15} /> Registrar servicio
      </Link>

      {/* Vehicles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-white flex items-center gap-1.5">
            <Car size={14} className="text-zinc-500" /> Vehículos
          </h2>
          <Link
            to={`/services/new?customerId=${customer.id}&addVehicle=true`}
            className="text-xs text-brand-500"
          >
            + Agregar vehículo
          </Link>
        </div>

        {!customer.vehicles || customer.vehicles.length === 0 ? (
          <div className="card text-center py-6 text-sm text-muted">
            Sin vehículos registrados
          </div>
        ) : (
          customer.vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              expanded={expandedVehicle === vehicle.id}
              onToggle={() =>
                setExpandedVehicle(expandedVehicle === vehicle.id ? null : vehicle.id)
              }
              onSendReminder={sendReminder}
            />
          ))
        )}
      </div>
    </div>
  );
}

function VehicleCard({
  vehicle, expanded, onToggle, onSendReminder,
}: {
  vehicle: Vehicle;
  expanded: boolean;
  onToggle: () => void;
  onSendReminder: (id: string) => void;
}) {
  return (
    <div className="card space-y-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <div className="text-sm font-medium text-white">
            {vehicle.marca} {vehicle.modelo}
          </div>
          <div className="text-xs text-muted">
            {vehicle.año} {vehicle.placa && `· ${vehicle.placa}`} {vehicle.color && `· ${vehicle.color}`}
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-zinc-600" />
        ) : (
          <ChevronDown size={16} className="text-zinc-600" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2 pt-2 border-t border-surface-600">
          <h3 className="text-xs font-medium text-zinc-500 flex items-center gap-1">
            <Wrench size={11} /> Historial de servicios
          </h3>
          {!vehicle.serviceRecords || vehicle.serviceRecords.length === 0 ? (
            <div className="text-xs text-muted text-center py-3">Sin servicios registrados</div>
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

function ServiceRow({
  record, onSendReminder,
}: {
  record: ServiceRecord;
  onSendReminder: (id: string) => void;
}) {
  return (
    <div className="bg-surface-700 rounded-lg p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium text-white">
            {SERVICE_LABELS[record.tipo_servicio]}
          </div>
          <div className="text-xs text-muted">
            {format(parseISO(record.fecha_servicio), 'd MMM yyyy', { locale: es })} · $
            {Number(record.costo).toLocaleString('es-MX')}
          </div>
        </div>
        {record.proximo_servicio_estimado && !record.recordatorio_enviado && (
          <button
            onClick={() => onSendReminder(record.id)}
            className="shrink-0 flex items-center gap-1 text-[10px] text-brand-500 bg-brand-500/10 rounded px-2 py-1"
          >
            <Send size={10} /> Avisar
          </button>
        )}
      </div>

      {record.proximo_servicio_estimado && (
        <div className="text-[10px] text-amber-400">
          Próx: {format(parseISO(record.proximo_servicio_estimado), 'd MMM yyyy', { locale: es })}
          {record.recordatorio_enviado && (
            <span className="ml-2 text-brand-500">· Recordatorio enviado</span>
          )}
        </div>
      )}
      {record.descripcion && (
        <div className="text-[10px] text-zinc-500">{record.descripcion}</div>
      )}
    </div>
  );
}
