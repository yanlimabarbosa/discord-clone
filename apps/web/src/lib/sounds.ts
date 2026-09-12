function tone(from: number, to: number, gainStart = 0.12) {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + 0.14);
    gain.gain.setValueAtTime(gainStart, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t);
    osc.stop(t + 0.26);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available */
  }
}

export function playJoinSound() {
  tone(440, 660);
}

export function playLeaveSound() {
  tone(560, 320);
}

export function playMentionSound() {
  tone(880, 1180, 0.09);
}
