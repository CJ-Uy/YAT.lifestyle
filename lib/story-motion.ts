const clamp = (value: number) => Math.min(1, Math.max(0, value));

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
  const startY = viewport * (viewport < 720 ? 0.25 : 0.38);
  return {
    progress,
    frame: Math.min(STORY_FRAMES - 1, Math.round(seconds * 12)),
    dropY,
    focusY: startY + (landingY - startY) * clamp((progress - 0.6) / 0.24),
    landingY,
    filmOpacity: 1 - clamp((progress - 0.82) / 0.07),
    dropIsolation: clamp((progress - 0.82) / 0.07),
    logoReveal: clamp((progress - 0.89) / 0.1),
    narrationOpacity: 1 - clamp((progress - 0.77) / 0.07),
    zoom: 1 + film * 0.12,
  };
}
