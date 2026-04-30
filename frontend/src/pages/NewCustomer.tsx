import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface FormData {
  nombre: string;
  telefono: string;
  email?: string;
  notas?: string;
}

export default function NewCustomer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  const mutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: (data) => {
      toast.success('Cliente registrado');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate(`/customers/${data.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (data: FormData) => {
    const clean = { ...data, telefono: data.telefono.replace(/\D/g, '') };
    mutation.mutate(clean);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-semibold text-white">Nuevo cliente</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Nombre completo *</label>
          <input
            className="input"
            placeholder="Juan Pérez"
            {...register('nombre', { required: 'El nombre es requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
          />
          {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>}
        </div>

        <div>
          <label className="label">Teléfono * (10 dígitos)</label>
          <input
            className="input"
            placeholder="9611234567"
            type="tel"
            inputMode="numeric"
            {...register('telefono', {
              required: 'El teléfono es requerido',
              pattern: { value: /^\d{10}$/, message: 'Debe tener 10 dígitos' },
            })}
          />
          {errors.telefono && <p className="text-red-400 text-xs mt-1">{errors.telefono.message}</p>}
        </div>

        <div>
          <label className="label">Email (opcional)</label>
          <input
            className="input"
            placeholder="juan@email.com"
            type="email"
            {...register('email', {
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
            })}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Notas (opcional)</label>
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="Notas sobre el cliente..."
            {...register('notas')}
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
          {isSubmitting ? 'Guardando...' : 'Registrar cliente'}
        </button>
      </form>
    </div>
  );
}
