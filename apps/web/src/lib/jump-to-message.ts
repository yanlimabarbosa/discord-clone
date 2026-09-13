export function messageDomId(id: string): string {
  return `msg-${id}`;
}

export function jumpToMessage(id: string): void {
  const el = document.getElementById(messageDomId(id));
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.remove('is-flashing');
  void el.offsetWidth;
  el.classList.add('is-flashing');
  window.setTimeout(() => el.classList.remove('is-flashing'), 1800);
}
