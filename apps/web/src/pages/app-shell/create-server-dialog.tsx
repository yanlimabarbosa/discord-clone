import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateServer } from '../../hooks/servers/use-create-server';

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(40),
});
type FormData = z.infer<typeof schema>;

type CreateServerDialogProps = {
  onClose: () => void;
};

export function CreateServerDialog({ onClose }: CreateServerDialogProps) {
  const createServer = useCreateServer();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Create a server</h2>
        <p className="modal-subtitle">Give your new server a name.</p>
        <form
          className="auth-form"
          onSubmit={handleSubmit(async ({ name }) => {
            await createServer.mutateAsync(name);
            onClose();
          })}
        >
          <label className="field-label">Server name</label>
          <input className="field-input" autoFocus {...register('name')} />
          {errors.name && (
            <span className="field-error">{errors.name.message}</span>
          )}
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createServer.isPending}
            >
              {createServer.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
