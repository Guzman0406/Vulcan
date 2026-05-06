import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customersApi } from '../services/api';
import { Customer } from '../types';

export default function Customers() {
  const [search, setSearch] = useState('');

  const { data: customersRaw, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.getAll(search || undefined),
    staleTime: 10_000,
  });

  const customers: Customer[] = Array.isArray(customersRaw) ? customersRaw : [];

  const initials = (nombre: string) =>
    nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const avatarColors = [
    { bg: 'bg-primary-container', text: 'text-on-primary-container' },
    { bg: 'bg-tertiary-container', text: 'text-on-tertiary' },
    { bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  ];

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg text-on-background">Clientes</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            {customers.length} registrados
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 22 }}>
          search
        </span>
        <input
          className="w-full h-[56px] pl-11 pr-stack-md rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-[72px] bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: 48 }}>
            group
          </span>
          <p className="text-body-lg text-on-surface-variant mt-4">
            {search ? 'Sin resultados para tu búsqueda' : 'No hay clientes registrados'}
          </p>
          {!search && (
            <Link
              to="/customers/new"
              className="inline-flex items-center gap-2 mt-4 bg-primary text-on-primary text-label-lg px-6 h-[56px] rounded-lg hover:bg-surface-tint transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person_add</span>
              Agregar primer cliente
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <ul className="divide-y divide-outline-variant">
            {customers.map((customer, idx) => {
              const color = avatarColors[idx % avatarColors.length];
              return (
                <Link
                  key={customer.id}
                  to={`/customers/${customer.id}`}
                  className="flex items-center justify-between p-stack-md hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-stack-md">
                    <div className={`w-12 h-12 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-headline-md shrink-0`}>
                      {initials(customer.nombre)}
                    </div>
                    <div>
                      <div className="text-headline-md text-on-surface group-hover:text-primary transition-colors">
                        {customer.nombre}
                      </div>
                      <div className="text-body-md text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>phone</span>
                        {customer.telefono}
                        {customer.vehicles && customer.vehicles.length > 0 && (
                          <span className="ml-2 bg-surface-container text-on-surface-variant text-label-sm px-2 py-0.5 rounded-full border border-outline-variant">
                            {customer.vehicles.length} vehículo{customer.vehicles.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </ul>
        </div>
      )}

      {/* FAB */}
      <Link
        to="/customers/new"
        className="fixed bottom-[96px] right-margin-mobile w-14 h-14 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:bg-surface-tint active:scale-95 transition-all shadow-lg z-40"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>add</span>
      </Link>
    </div>
  );
}