export type ToastKind = 'error' | 'success' | 'info';

export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

const TOAST_TTL_MS = 5000;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function push(kind: ToastKind, message: string) {
  const id = nextId++;
  toasts = [...toasts, { id, kind, message }];
  emit();
  window.setTimeout(() => dismiss(id), TOAST_TTL_MS);
}

export const toastStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return toasts;
  },
  dismiss,
  error(message: string) {
    push('error', message);
  },
  success(message: string) {
    push('success', message);
  },
  info(message: string) {
    push('info', message);
  },
};
