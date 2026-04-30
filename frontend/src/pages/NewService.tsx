import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersApi, vehiclesApi, servicesApi } from '../services/api';
import { Customer, Vehicle, ServiceType, SERVICE_LABELS } from '../types';
import { ArrowLeft, Search, Car, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type Step = 'customer' | 'vehicle' | 'service';

export default function NewService() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>('customer');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searchResult, setSearchResult] = useState<Customer | null>(null);
  const [searching, setSearching] = useState(false);

  // Pre-fill from URL params
  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId) {
      customersApi.getOne(customerId).then((c) => {
        setSelectedCustomer(c);
        setStep('vehicle');
      });
    }
  }, []);

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', selectedCustomer?.id],
    queryFn: () => vehiclesApi.getByCustomer(selectedCustomer!.id),
    enabled: !!selectedCustomer,
  });

  const searchByPhone = async () => {
    if (!phoneSearch || phoneSearch.length < 10) return;
    setSearching(true);
    try {
      const customer = await customersApi.getByPhone(phoneSearch.replace(/\D/g, ''));
      setSearchResult(customer);
    } catch {
      setSearchResult(null);
      toast.error('No se encontró cliente con ese teléfono');
    } finally {
      setSearching(false);
    }
  };

  const vehicleForm = useForm({
    defaultValues: { marca: '', modelo: '', año: new Date().getFullYear(), placa: '', color: '' },
  });

  const serviceForm = useForm({
    defaultValues: {
      tipo_servicio: 'reparacion_llanta' as ServiceType,
      descripcion: '',
      costo: '',
      fecha_servicio: format(new Date(), 'yyyy-MM-dd'),
      proximo_servicio_estimado: '',
    },
  });

  const createVehicleMutation = useMutation({
    mutationFn: (data: any) => vehiclesApi.create({ ...data, customerId: selectedCustomer!.id }),
    onSuccess: (vehicle) => {
      setSelectedVehicle(vehicle);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setStep('service');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: any) =>
      servicesApi.create({ ...data, vehicleId: selectedVehicle!.id }),
    onSuccess: () => {
      toast.success('Servicio registrado');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['customer', selectedCustomer?.id] });
      navigate(`/customers/${selectedCustomer?.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const steps = ['customer', 'vehicle', 'service'];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => (stepIdx > 0 ? setStep(steps[stepIdx - 1] as Step) : navigate(-1))} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">Registrar servicio</h1>
          <p className="text-xs text-muted">Paso {stepIdx + 1} de 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIdx ? 'bg-brand-500' : 'bg-surface-600'}`}
          />
        ))}
      </div>

      {/* Step 1: Customer */}
      {step === 'customer' && (
        <div className="space-y-4">
          <p className="text-sm text-subtle">Busca al cliente por teléfono</p>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="9611234567"
              type="tel"
              inputMode="numeric"
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchByPhone()}
            />
            <button onClick={searchByPhone} disabled={searching} className="btn-primary px-4">
              <Search size={15} />
            </button>
          </div>

          {searchResult && (
            <button
              onClick={() => { setSelectedCustomer(searchResult); setStep('vehicle'); }}
              className="card w-full text-left hover:border-brand-500 transition-colors"
            >
              <div className="font-medium text-white">{searchResult.nombre}</div>
              <div className="text-xs text-muted">{searchResult.telefono}</div>
            </button>
          )}

          <div className="text-center">
            <span className="text-xs text-muted">¿Cliente nuevo?</span>
            <button onClick={() => navigate('/customers/new')} className="text-xs text-brand-500 ml-2">
              Registrar aquí
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Vehicle */}
      {step === 'vehicle' && selectedCustomer && (
        <div className="space-y-4">
          <div className="card text-sm">
            <span className="text-muted text-xs">Cliente</span>
            <div className="font-medium text-white">{selectedCustomer.nombre}</div>
          </div>

          {vehicles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted">Selecciona vehículo existente</p>
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setSelectedVehicle(v); setStep('service'); }}
                  className={`card w-full text-left flex items-center gap-3 transition-colors hover:border-brand-500 ${selectedVehicle?.id === v.id ? 'border-brand-500' : ''}`}
                >
                  <Car size={16} className="text-zinc-500 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white">{v.marca} {v.modelo}</div>
                    <div className="text-xs text-muted">{v.año} {v.placa && `· ${v.placa}`}</div>
                  </div>
                  {selectedVehicle?.id === v.id && <Check size={15} className="text-brand-500 ml-auto" />}
                </button>
              ))}
            </div>
          )}

          <div className="divider" />
          <p className="text-xs text-muted">O registra vehículo nuevo</p>

          <form onSubmit={vehicleForm.handleSubmit((d) => createVehicleMutation.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Marca *</label>
                <input className="input" placeholder="Toyota" {...vehicleForm.register('marca', { required: true })} />
              </div>
              <div>
                <label className="label">Modelo *</label>
                <input className="input" placeholder="Corolla" {...vehicleForm.register('modelo', { required: true })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Año *</label>
                <input className="input" type="number" {...vehicleForm.register('año', { required: true, valueAsNumber: true })} />
              </div>
              <div>
                <label className="label">Placa</label>
                <input className="input" placeholder="ABC-123" {...vehicleForm.register('placa')} />
              </div>
            </div>
            <div>
              <label className="label">Color</label>
              <input className="input" placeholder="Blanco" {...vehicleForm.register('color')} />
            </div>
            <button type="submit" disabled={createVehicleMutation.isPending} className="btn-primary w-full justify-center">
              {createVehicleMutation.isPending ? 'Guardando...' : 'Registrar y continuar'}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Service */}
      {step === 'service' && selectedVehicle && (
        <div className="space-y-4">
          <div className="card text-sm space-y-1">
            <div className="text-xs text-muted">Vehículo</div>
            <div className="font-medium text-white">
              {selectedVehicle.marca} {selectedVehicle.modelo} {selectedVehicle.año}
            </div>
          </div>

          <form
            onSubmit={serviceForm.handleSubmit((d) =>
              createServiceMutation.mutate({ ...d, costo: parseFloat(d.costo) })
            )}
            className="space-y-3"
          >
            <div>
              <label className="label">Tipo de servicio *</label>
              <select className="input" {...serviceForm.register('tipo_servicio', { required: true })}>
                {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Descripción</label>
              <textarea
                className="input resize-none"
                rows={2}
                placeholder="Detalles del servicio..."
                {...serviceForm.register('descripcion')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Costo (MXN) *</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...serviceForm.register('costo', { required: true, min: 0 })}
                />
              </div>
              <div>
                <label className="label">Fecha servicio *</label>
                <input className="input" type="date" {...serviceForm.register('fecha_servicio', { required: true })} />
              </div>
            </div>

            <div>
              <label className="label">Próximo servicio estimado</label>
              <input className="input" type="date" {...serviceForm.register('proximo_servicio_estimado')} />
              <p className="text-[10px] text-muted mt-1">Si lo defines, se enviará recordatorio automático</p>
            </div>

            <button type="submit" disabled={createServiceMutation.isPending} className="btn-primary w-full justify-center">
              {createServiceMutation.isPending ? 'Guardando...' : 'Guardar servicio'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
