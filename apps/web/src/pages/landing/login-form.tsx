import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from './schemas/login-schema';

type LoginFormProps = {
  isPending: boolean;
  error: string | null;
  onSubmit: (input: LoginFormData) => void;
};

export function LoginForm({ isPending, error, onSubmit }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      <label className="field-label">Username</label>
      <input className="field-input" autoFocus {...register('username')} />
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
        {isPending ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  );
}
