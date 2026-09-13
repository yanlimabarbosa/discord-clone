import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateChannel } from '../../hooks/channels/use-update-channel';
import { useDeleteChannel } from '../../hooks/channels/use-delete-channel';
import { useEscapeKey } from '../../hooks/use-escape-key';
import { toastStore } from '../../lib/toast-store';
import type { Channel } from '../../types/server';

const schema = z.object({
  name: z.string().min(1, 'Required').max(40),
  icon: z.string().max(4).optional(),
});
type FormData = z.infer<typeof schema>;

type EditChannelDialogProps = {
  channel: Channel;
  serverId: string;
  onClose: () => void;
};

export function EditChannelDialog({
  channel,
  serverId,
  onClose,
}: EditChannelDialogProps) {
  const update = useUpdateChannel(serverId);
  const remove = useDeleteChannel(serverId);
  useEscapeKey(onClose);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: channel.name, icon: channel.icon ?? '' },
  });

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit channel"
      >
        <h2 className="modal-title">Edit channel</h2>
        <form
          className="auth-form"
          onSubmit={handleSubmit(async (data) => {
            await update.mutateAsync({
              channelId: channel.id,
              name: data.name,
              icon: data.icon ?? '',
            });
            toastStore.success('Channel updated');
            onClose();
          })}
        >
          <label className="field-label">Icon (emoji, optional)</label>
          <input
            className="field-input"
            placeholder="e.g. 🎮"
            {...register('icon')}
          />
          <label className="field-label">Channel name</label>
          <input className="field-input" autoFocus {...register('name')} />
          {errors.name && (
            <span className="field-error">{errors.name.message}</span>
          )}
          <div className="modal-actions modal-actions-split">
            <button
              type="button"
              className="btn-danger"
              disabled={remove.isPending}
              onClick={async () => {
                await remove.mutateAsync(channel.id);
                toastStore.success('Channel deleted');
                onClose();
              }}
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </button>
            <div className="modal-actions-right">
              <button type="button" className="btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={update.isPending}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
