const REFUSED_KEY = 'nyx.notificationsRefused';

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function wasRefused(): boolean {
  try {
    return localStorage.getItem(REFUSED_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberRefusal() {
  try {
    localStorage.setItem(REFUSED_KEY, '1');
  } catch {
    // ignore storage failures (private mode, quota)
  }
}

// Asked lazily the first time an event would make sound anyway (mention/DM),
// never on load. A denied or dismissed prompt is remembered in localStorage so
// the user is never re-prompted.
export function requestNotificationPermission() {
  if (!isSupported()) return;
  if (Notification.permission !== 'default') return;
  if (wasRefused()) return;
  Notification.requestPermission()
    .then((permission) => {
      if (permission !== 'granted') rememberRefusal();
    })
    .catch(() => undefined);
}

// OS-level notification; only fires when the tab is hidden (visible tabs
// already show toasts/unread dots). No-ops when unsupported or not granted.
export function notify(title: string, body?: string) {
  if (!isSupported()) return;
  if (!document.hidden) return;
  if (Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(title, body ? { body } : undefined);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // some platforms (e.g. Android Chrome) require a service worker
  }
}
