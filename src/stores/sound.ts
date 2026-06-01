let enabled = true;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

export function isSoundEnabled() {
  return enabled;
}

function playTone(frequency: number, durationMs: number, volume = 0.08) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.stop(ctx.currentTime + durationMs / 1000);
    osc.onended = () => void ctx.close();
  } catch {
    // Audio unavailable — silent fallback
  }
}

export function playAchievementSound() {
  playTone(523, 120);
  setTimeout(() => playTone(659, 120), 100);
  setTimeout(() => playTone(784, 180), 200);
}

export function playLevelUpSound() {
  playTone(440, 100);
  setTimeout(() => playTone(554, 100), 80);
  setTimeout(() => playTone(659, 100), 160);
  setTimeout(() => playTone(880, 200), 240);
}
