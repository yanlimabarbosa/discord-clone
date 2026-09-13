import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Hash, Volume2 } from 'lucide-react';
import { useCreateChannel } from '../../hooks/channels/use-create-channel';
import { useEscapeKey } from '../../hooks/use-escape-key';
import { toastStore } from '../../lib/toast-store';

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
  useEscapeKey(onClose);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'TEXT' },
  });

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create a channel"
      >
        <h2 className="modal-title">Create a channel</h2>
        <form
          className="auth-form"
          onSubmit={handleSubmit(async (data) => {
            await createChannel.mutateAsync(data);
            toastStore.success('Channel created');
            onClose();
          })}
        >
          <label className="field-label">Channel type</label>
          <div className="radio-row">
            <label className="radio-option">
              <input type="radio" value="TEXT" {...register('type')} />
              <Hash size={16} /> Text
            </label>
            <label className="radio-option">
              <input type="radio" value="VOICE" {...register('type')} />
              <Volume2 size={16} /> Voice
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
