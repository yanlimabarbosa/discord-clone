import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateChannel } from '../../hooks/channels/use-update-channel';
import { useDeleteChannel } from '../../hooks/channels/use-delete-channel';
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: channel.name, icon: channel.icon ?? '' },
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit channel</h2>
        <form
          className="auth-form"
          onSubmit={handleSubmit(async (data) => {
            await update.mutateAsync({
              channelId: channel.id,
              name: data.name,
              icon: data.icon ?? '',
            });
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
              onClick={async () => {
                await remove.mutateAsync(channel.id);
                onClose();
              }}
            >
              Delete
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
