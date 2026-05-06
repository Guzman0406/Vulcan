import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customersApi } from '../services/api';
import { Customer } from '../types';
import { Search, Plus, ChevronRight, Car, Phone } from 'lucide-react';

export default function Customers() {
  const [search, setSearch] = useState('');

  const { data: customersRaw, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.getAll(search || undefined),
    staleTime: 10_000,
  });

  const customers: Customer[] = Array.isArray(customersRaw) ? customersRaw : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Clientes</h1>
          <p className="text-xs text-muted mt-0.5">{customers.length} registrados</p>
        </div>
        <Link to="/customers/new" className="btn-primary">
          <Plus size={15} /> Nuevo
        </Link>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          className="input pl-9"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-16 animate-pulse bg-surface-700" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted text-sm">
            {search ? 'Sin resultados para tu búsqueda' : 'No hay clientes registrados'}
          </p>
          {!search && (
            <Link to="/customers/new" className="btn-primary mt-4 inline-flex">
              <Plus size={15} /> Agregar primer cliente
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              to={`/customers/${customer.id}`}
              className="card flex items-center gap-3 hover:border-surface-500 transition-colors active:scale-[0.99]"
            >
              <div className="w-9 h-9 rounded-full bg-surface-600 flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-zinc-300">
                  {customer.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-white text-sm truncate">{customer.nombre}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Phone size={10} /> {customer.telefono}
                  </span>
                  {customer.vehicles && customer.vehicles.length > 0 && (
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Car size={10} /> {customer.vehicles.length}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-700 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}