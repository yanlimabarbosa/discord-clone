const PALETTE = [
  '#5865f2',
  '#3ba55d',
  '#faa61a',
  '#ed4245',
  '#eb459e',
  '#00a8fc',
  '#9b59b6',
  '#f47b67',
];

export function userColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}
