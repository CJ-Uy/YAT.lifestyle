const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

export const STORY_FRAMES = 48;

export function storyMotion(top: number, height: number, viewport: number, landingY: number) {
  const progress = clamp(-top / Math.max(1, height - viewport));
  const film = clamp(progress / 0.84);
  const seconds = film < 0.29 ? (film / 0.29) * 3 : 3 + ((film - 0.29) / 0.71) * 0.9;
  const track = [[0, 405], [2.4, 455], [3.2, 560], [3.9, 820]];
  const next = track.findIndex(([time]) => time >= seconds);
  const [fromTime, fromY] = track[Math.max(0, next - 1)];
  const [toTime, toY] = track[next < 0 ? track.length - 1 : next];
  const dropY = fromY + (toY - fromY) * clamp((seconds - fromTime) / Math.max(0.001, toTime - fromTime));
  const startY = viewport * (viewport < 720 ? 0.3 : 0.36);
  const settle = ease((progress - 0.875) / 0.095);
  const scenes = [0, 0.22, 0.4, 0.58, 0.75].map((center, index) => {
    const enter = index === 0 ? 1 : ease((progress - center + 0.085) / 0.06);
    const leave = 1 - ease((progress - center - (index === 0 ? 0.09 : 0.05)) / 0.06);
    return { opacity: enter * leave, offset: (center - progress) * 110 };
  });
  return {
    progress,
    // Retire the opening backlight before the film advances beyond frame zero.
    idleLightOpacity: 1 - ease(progress / 0.003),
    frame: Math.min(STORY_FRAMES - 1, Math.round(seconds * 12)),
    dropY,
    focusY: startY + (landingY - startY) * settle,
    landingY,
    filmOpacity: 1 - ease((progress - 0.81) / 0.06),
    vectorOpacity: ease((progress - 0.81) / 0.06),
    dropMorph: ease((progress - 0.875) / 0.065),
    settle,
    logoReveal: ease((progress - 0.89) / 0.09),
    signatureReveal: ease((progress - 0.95) / 0.05),
    atmosphereOpacity: 1 - ease((progress - 0.78) / 0.12),
    scenes,
    zoom: 1 + film * 0.04,
  };
}
