import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from './schemas/register-schema';

type RegisterFormProps = {
  isPending: boolean;
  error: string | null;
  onSubmit: (input: RegisterFormData) => void;
};

export function RegisterForm({ isPending, error, onSubmit }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      <label className="field-label">Display name</label>
      <input className="field-input" autoFocus {...register('displayName')} />
      {errors.displayName && (
        <span className="field-error">{errors.displayName.message}</span>
      )}
      <label className="field-label">Username</label>
      <input className="field-input" {...register('username')} />
      {errors.username && (
        <span className="field-error">{errors.username.message}</span>
      )}
      <label className="field-label">Password</label>
      <input
        className="field-input"
        type="password"
        {...register('password')}
      />
      {errors.password && (
        <span className="field-error">{errors.password.message}</span>
      )}
      {error && <span className="field-error">{error}</span>}
      <button className="btn-primary" type="submit" disabled={isPending}>
        {isPending ? 'Creating…' : 'Create account'}
      </button>
    </form>
  );
}
