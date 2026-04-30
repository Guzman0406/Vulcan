export enum ServiceType {
  REPARACION_LLANTA = 'reparacion_llanta',
  CAMBIO_LLANTA = 'cambio_llanta',
  ROTACION_LLANTAS = 'rotacion_llantas',
  BALANCEO = 'balanceo',
  CAMBIO_ACEITE = 'cambio_aceite',
  CAMBIO_FILTRO = 'cambio_filtro',
  REVISION_GENERAL = 'revision_general',
  INFLADO_NITROGENO = 'inflado_nitrogeno',
  OTRO = 'otro',
}

export const ServiceTypeLabels: Record<ServiceType, string> = {
  [ServiceType.REPARACION_LLANTA]: 'Reparación de llanta',
  [ServiceType.CAMBIO_LLANTA]: 'Cambio de llanta',
  [ServiceType.ROTACION_LLANTAS]: 'Rotación de llantas',
  [ServiceType.BALANCEO]: 'Balanceo',
  [ServiceType.CAMBIO_ACEITE]: 'Cambio de aceite',
  [ServiceType.CAMBIO_FILTRO]: 'Cambio de filtro',
  [ServiceType.REVISION_GENERAL]: 'Revisión general',
  [ServiceType.INFLADO_NITROGENO]: 'Inflado con nitrógeno',
  [ServiceType.OTRO]: 'Otro',
};
