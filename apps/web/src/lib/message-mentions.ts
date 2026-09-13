function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function mentionsUser(
  content: string,
  name: string | undefined,
): boolean {
  if (/(^|[^\w@])@everyone(?!\w)/i.test(content)) return true;
  if (!name) return false;
  const re = new RegExp(`(^|[^\\w@])@${escapeRegExp(name)}(?!\\w)`, 'i');
  return re.test(content);
}
