import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateChannel } from '../../hooks/channels/use-create-channel';

const schema = z.object({
  name: z.string().min(1, 'Required').max(40),
  type: z.enum(['TEXT', 'VOICE']),
});
type FormData = z.infer<typeof schema>;

type CreateChannelDialogProps = {
  serverId: string;
  onClose: () => void;
};

export function CreateChannelDialog({
  serverId,
  onClose,
}: CreateChannelDialogProps) {
  const createChannel = useCreateChannel(serverId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'TEXT' },
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Create a channel</h2>
        <form
          className="auth-form"
          onSubmit={handleSubmit(async (data) => {
            await createChannel.mutateAsync(data);
            onClose();
          })}
        >
          <label className="field-label">Channel type</label>
          <div className="radio-row">
            <label className="radio-option">
              <input type="radio" value="TEXT" {...register('type')} /># Text
            </label>
            <label className="radio-option">
              <input type="radio" value="VOICE" {...register('type')} />🔊 Voice
            </label>
          </div>
          <label className="field-label">Channel name</label>
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
              disabled={createChannel.isPending}
            >
              {createChannel.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
