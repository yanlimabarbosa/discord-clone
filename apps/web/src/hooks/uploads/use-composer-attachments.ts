import { useCallback, useState } from 'react';
import { uploadAttachment } from './use-upload-attachment';

export type StagedAttachment = {
  id: string;
  previewUrl: string;
  url?: string;
  type?: string;
  uploading: boolean;
  error?: boolean;
};

export function imageFilesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return [];
  return Array.from(data.items)
    .filter((it) => it.kind === 'file' && it.type.startsWith('image/'))
    .map((it) => it.getAsFile())
    .filter((f): f is File => !!f);
}

export function useComposerAttachments() {
  const [items, setItems] = useState<StagedAttachment[]>([]);

  const addFiles = useCallback((files: File[]) => {
    files.forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      setItems((prev) => [...prev, { id, previewUrl, uploading: true }]);
      uploadAttachment(file)
        .then((res) =>
          setItems((prev) =>
            prev.map((i) =>
              i.id === id
                ? { ...i, url: res.url, type: res.type, uploading: false }
                : i,
            ),
          ),
        )
        .catch(() =>
          setItems((prev) =>
            prev.map((i) =>
              i.id === id ? { ...i, uploading: false, error: true } : i,
            ),
          ),
        );
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const gone = prev.find((i) => i.id === id);
      if (gone) URL.revokeObjectURL(gone.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setItems((prev) => {
      prev.forEach((i) => URL.revokeObjectURL(i.previewUrl));
      return [];
    });
  }, []);

  const ready = items
    .filter((i) => i.url && !i.uploading && !i.error)
    .map((i) => ({ url: i.url as string, type: i.type as string }));
  const anyUploading = items.some((i) => i.uploading);

  return { items, addFiles, remove, clear, ready, anyUploading };
}
