const EMOJI_SEQUENCE =
  /\p{Extended_Pictographic}(?:\u{FE0F}|\p{Emoji_Modifier})*(?:\u{200D}\p{Extended_Pictographic}(?:\u{FE0F}|\p{Emoji_Modifier})*)*|\p{Regional_Indicator}\p{Regional_Indicator}/gu;

export function isJumboEmoji(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  const matches = trimmed.match(EMOJI_SEQUENCE);
  if (!matches || matches.length === 0 || matches.length > 3) return false;
  return trimmed.replace(EMOJI_SEQUENCE, '').trim() === '';
}
