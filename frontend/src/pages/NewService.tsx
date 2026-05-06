import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersApi, vehiclesApi, servicesApi } from '../services/api';
import { Customer, Vehicle, ServiceType, SERVICE_LABELS } from '../types';
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

  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId) {
      customersApi.getOne(customerId).then((c) => {
        setSelectedCustomer(c);
        setStep('vehicle');
      });
    }
  }, []);

  const { data: vehiclesRaw } = useQuery({
    queryKey: ['vehicles', selectedCustomer?.id],
    queryFn: () => vehiclesApi.getByCustomer(selectedCustomer!.id),
    enabled: !!selectedCustomer,
  });

  const vehicles: Vehicle[] = Array.isArray(vehiclesRaw) ? vehiclesRaw : [];

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
    mutationFn: (data: any) => servicesApi.create({ ...data, vehicleId: selectedVehicle!.id }),
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
  const stepLabels = ['Cliente', 'Vehículo', 'Servicio'];
  const progressPct = ((stepIdx + 1) / 3) * 100;

  return (
    <div className="space-y-stack-lg pb-32">
      {/* Header */}
      <div className="flex items-center gap-stack-md">
        <button
          onClick={() => stepIdx > 0 ? setStep(steps[stepIdx - 1] as Step) : navigate(-1)}
          className="w-touch-target-min h-touch-target-min flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-headline-lg text-on-background">Registrar servicio</h1>
          <p className="text-body-md text-on-surface-variant">Paso {stepIdx + 1} de 3 — {stepLabels[stepIdx]}</p>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between mb-stack-sm">
          <span className="text-label-lg text-on-surface-variant">{stepLabels[stepIdx]}</span>
          <span className="text-label-sm text-on-surface-variant">{Math.round(progressPct)}%</span>
        </div>
        <div className="w-full bg-surface-container-highest rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Step 1: Customer */}
      {step === 'customer' && (
        <div className="space-y-stack-md">
          <p className="text-body-lg text-on-surface-variant">Busca al cliente por teléfono</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 22 }}>phone</span>
              <input
                className="w-full h-[56px] pl-11 pr-stack-md rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline"
                placeholder="9611234567"
                type="tel"
                inputMode="numeric"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchByPhone()}
              />
            </div>
            <button
              onClick={searchByPhone}
              disabled={searching}
              className="w-[56px] h-[56px] bg-primary text-on-primary rounded-lg flex items-center justify-center hover:bg-surface-tint transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>

          {searchResult && (
            <button
              onClick={() => { setSelectedCustomer(searchResult); setStep('vehicle'); }}
              className="w-full bg-surface-container-lowest border border-primary rounded-xl p-stack-md text-left hover:bg-surface-container-low transition-colors flex items-center gap-stack-md"
            >
              <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-label-lg shrink-0">
                {searchResult.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-headline-md text-on-surface">{searchResult.nombre}</div>
                <div className="text-body-md text-on-surface-variant">{searchResult.telefono}</div>
              </div>
              <span className="material-symbols-outlined text-primary ml-auto">chevron_right</span>
            </button>
          )}

          <div className="text-center pt-stack-md">
            <span className="text-body-md text-on-surface-variant">¿Cliente nuevo? </span>
            <button onClick={() => navigate('/customers/new')} className="text-label-lg text-primary">
              Registrar aquí
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Vehicle */}
      {step === 'vehicle' && selectedCustomer && (
        <div className="space-y-stack-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex items-center gap-stack-md">
            <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-label-lg shrink-0">
              {selectedCustomer.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-label-sm text-on-surface-variant">Cliente</div>
              <div className="text-headline-md text-on-surface">{selectedCustomer.nombre}</div>
            </div>
          </div>

          {vehicles.length > 0 && (
            <div className="space-y-2">
              <p className="text-label-lg text-on-surface-variant">Selecciona vehículo existente</p>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVehicle(v); setStep('service'); }}
                    className={`w-full flex items-center gap-stack-md p-stack-md hover:bg-surface-container-low transition-colors border-b border-outline-variant last:border-0 ${selectedVehicle?.id === v.id ? 'bg-surface-container-low' : ''}`}
                  >
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-on-surface-variant">directions_car</span>
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-headline-md text-on-surface">{v.marca} {v.modelo}</div>
                      <div className="text-body-md text-on-surface-variant">{v.año}{v.placa && ` · ${v.placa}`}</div>
                    </div>
                    {selectedVehicle?.id === v.id && (
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-stack-md">
            <div className="flex-1 border-t border-outline-variant" />
            <span className="text-body-md text-on-surface-variant">o agrega uno nuevo</span>
            <div className="flex-1 border-t border-outline-variant" />
          </div>

          <form onSubmit={vehicleForm.handleSubmit((d) => createVehicleMutation.mutate(d))} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md space-y-stack-md">
            <div className="grid grid-cols-2 gap-stack-md">
              <div>
                <label className="block text-label-lg text-on-surface-variant mb-stack-sm">Marca *</label>
                <input className="w-full h-[56px] px-stack-md rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Toyota" {...vehicleForm.register('marca', { required: true })} />
              </div>
              <div>
                <label className="block text-label-lg text-on-surface-variant mb-stack-sm">Modelo *</label>
                <input className="w-full h-[56px] px-stack-md rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Corolla" {...vehicleForm.register('modelo', { required: true })} />
              </div>
              <div>
                <label className="block text-label-lg text-on-surface-variant mb-stack-sm">Año *</label>
                <input className="w-full h-[56px] px-stack-md rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" type="number" {...vehicleForm.register('año', { required: true, valueAsNumber: true })} />
              </div>
              <div>
                <label className="block text-label-lg text-on-surface-variant mb-stack-sm">Color</label>
                <input className="w-full h-[56px] px-stack-md rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Blanco" {...vehicleForm.register('color')} />
              </div>
            </div>
            <div>
              <label className="block text-label-lg text-on-surface-variant mb-stack-sm">Placa</label>
              <input className="w-full h-[56px] px-stack-md rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase font-mono" placeholder="ABC-123" {...vehicleForm.register('placa')} />
            </div>
            <button type="submit" disabled={createVehicleMutation.isPending} className="w-full h-[56px] bg-primary text-on-primary text-label-lg rounded-lg hover:bg-surface-tint transition-colors disabled:opacity-50">
              {createVehicleMutation.isPending ? 'Guardando...' : 'Registrar y continuar'}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Service */}
      {step === 'service' && selectedVehicle && (
        <div className="space-y-stack-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex items-center gap-stack-md">
            <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant">directions_car</span>
            </div>
            <div>
              <div className="text-label-sm text-on-surface-variant">Vehículo</div>
              <div className="text-headline-md text-on-surface">{selectedVehicle.marca} {selectedVehicle.modelo} {selectedVehicle.año}</div>
            </div>
          </div>

          <form onSubmit={serviceForm.handleSubmit((d) => createServiceMutation.mutate({ ...d, costo: parseFloat(d.costo) }))} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md space-y-stack-md">
            <div>
              <label className="block text-label-lg text-on-surface-variant mb-stack-sm">Tipo de servicio *</label>
              <select className="w-full h-[56px] px-stack-md rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" {...serviceForm.register('tipo_servicio', { required: true })}>
                {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-label-lg text-on-surface-variant mb-stack-sm">Descripción</label>
              <textarea className="w-full px-stack-md py-3 rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none placeholder:text-outline" rows={2} placeholder="Detalles del servicio..." {...serviceForm.register('descripcion')} />
            </div>

            <div className="grid grid-cols-2 gap-stack-md">
              <div>
                <label className="block text-label-lg text-on-surface-variant mb-stack-sm">Costo (MXN) *</label>
                <input className="w-full h-[56px] px-stack-md rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" type="number" step="0.01" placeholder="0.00" {...serviceForm.register('costo', { required: true, min: 0 })} />
              </div>
              <div>
                <label className="block text-label-lg text-on-surface-variant mb-stack-sm">Fecha *</label>
                <input className="w-full h-[56px] px-stack-md rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" type="date" {...serviceForm.register('fecha_servicio', { required: true })} />
              </div>
            </div>

            <div>
              <label className="block text-label-lg text-on-surface-variant mb-stack-sm">Próximo servicio estimado</label>
              <input className="w-full h-[56px] px-stack-md rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" type="date" {...serviceForm.register('proximo_servicio_estimado')} />
              <p className="text-label-sm text-on-surface-variant mt-1">Si lo defines, se enviará recordatorio automático</p>
            </div>

            <button type="submit" disabled={createServiceMutation.isPending} className="w-full h-[56px] bg-primary text-on-primary text-label-lg rounded-lg hover:bg-surface-tint transition-colors disabled:opacity-50">
              {createServiceMutation.isPending ? 'Guardando...' : 'Guardar servicio'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}