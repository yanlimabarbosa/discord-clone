import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { guestSchema, type GuestFormData } from './schemas/guest-schema';

type GuestFormProps = {
  isPending: boolean;
  error: string | null;
  onSubmit: (displayName: string) => void;
};

export function GuestForm({ isPending, error, onSubmit }: GuestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestFormData>({ resolver: zodResolver(guestSchema) });

  return (
    <form
      className="auth-form"
      onSubmit={handleSubmit((data) => onSubmit(data.displayName))}
    >
      <label className="field-label">Nickname</label>
      <input
        className="field-input"
        placeholder="What should we call you?"
        autoFocus
        {...register('displayName')}
      />
      {errors.displayName && (
        <span className="field-error">{errors.displayName.message}</span>
      )}
      {error && <span className="field-error">{error}</span>}
      <button className="btn-primary" type="submit" disabled={isPending}>
        {isPending ? 'Entering…' : 'Continue as guest'}
      </button>
      <p className="auth-hint">No account needed — jump straight in.</p>
    </form>
  );
}
