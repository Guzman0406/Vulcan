export interface Customer {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  notas?: string;
  fecha_registro: string;
  vehicles?: Vehicle[];
}

export interface Vehicle {
  id: string;
  marca: string;
  modelo: string;
  año: number;
  placa?: string;
  color?: string;
  fecha_registro: string;
  customer?: Customer;
  serviceRecords?: ServiceRecord[];
}

export interface ServiceRecord {
  id: string;
  tipo_servicio: ServiceType;
  descripcion?: string;
  costo: number;
  fecha_servicio: string;
  proximo_servicio_estimado?: string;
  recordatorio_enviado: boolean;
  fecha_recordatorio_enviado?: string;
  fecha_creacion: string;
  vehicle?: Vehicle;
}

export type ServiceType =
  | 'reparacion_llanta'
  | 'cambio_llanta'
  | 'rotacion_llantas'
  | 'balanceo'
  | 'cambio_aceite'
  | 'cambio_filtro'
  | 'revision_general'
  | 'inflado_nitrogeno'
  | 'otro';

export const SERVICE_LABELS: Record<ServiceType, string> = {
  reparacion_llanta: 'Reparación de llanta',
  cambio_llanta: 'Cambio de llanta',
  rotacion_llantas: 'Rotación de llantas',
  balanceo: 'Balanceo',
  cambio_aceite: 'Cambio de aceite',
  cambio_filtro: 'Cambio de filtro',
  revision_general: 'Revisión general',
  inflado_nitrogeno: 'Inflado con nitrógeno',
  otro: 'Otro',
};

export interface DashboardStats {
  totalClientes: number;
  serviciosMes: number;
  recordatoriosPendientes: number;
  ingresosMes: number;
}
