const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
});

const dividerFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

export function dayKey(iso: string): number {
  const d = new Date(iso);
  return d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
}

export function formatTimeOnly(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatDayDivider(iso: string): string {
  return dividerFormatter.format(new Date(iso));
}

export function formatFullTimestamp(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const time = timeFormatter.format(d);
  const key = dayKey(iso);
  const todayKey =
    now.getFullYear() * 10000 + now.getMonth() * 100 + now.getDate();
  if (key === todayKey) return `Today at ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey =
    yesterday.getFullYear() * 10000 +
    yesterday.getMonth() * 100 +
    yesterday.getDate();
  if (key === yesterdayKey) return `Yesterday at ${time}`;
  return `${dateFormatter.format(d)} ${time}`;
}
