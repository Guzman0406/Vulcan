import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../services/api';
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
    mutation.mutate({ ...data, telefono: data.telefono.replace(/\D/g, '') });
  };

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <div className="flex items-center gap-stack-md">
        <button
          onClick={() => navigate(-1)}
          className="w-touch-target-min h-touch-target-min flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-headline-lg text-on-background">Nuevo cliente</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-stack-md">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md space-y-stack-md">

          {/* Nombre */}
          <div>
            <label className="block text-label-lg text-on-surface-variant mb-stack-sm">
              Nombre completo *
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 22 }}>
                person
              </span>
              <input
                className="w-full h-[56px] pl-11 pr-stack-md rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline"
                placeholder="Ej. Juan Pérez"
                {...register('nombre', {
                  required: 'El nombre es requerido',
                  minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                })}
              />
            </div>
            {errors.nombre && (
              <p className="text-label-sm text-error mt-1">{errors.nombre.message}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-label-lg text-on-surface-variant mb-stack-sm">
              Teléfono * (10 dígitos)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 22 }}>
                phone
              </span>
              <input
                className="w-full h-[56px] pl-11 pr-stack-md rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline"
                placeholder="9611234567"
                type="tel"
                inputMode="numeric"
                {...register('telefono', {
                  required: 'El teléfono es requerido',
                  pattern: { value: /^\d{10}$/, message: 'Debe tener 10 dígitos' }
                })}
              />
            </div>
            {errors.telefono && (
              <p className="text-label-sm text-error mt-1">{errors.telefono.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-label-lg text-on-surface-variant mb-stack-sm">
              Email <span className="text-body-md text-outline font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 22 }}>
                mail
              </span>
              <input
                className="w-full h-[56px] pl-11 pr-stack-md rounded-lg border border-outline-variant bg-surface text-on-surface text-body-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-outline"
                placeholder="ejemplo@correo.com"
                type="email"
                {...register('email', {
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invá