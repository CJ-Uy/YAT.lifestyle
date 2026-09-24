const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function storyMotion(top: number, height: number, viewport: number, header: number, duration: number) {
  const progress = clamp((header - top) / Math.max(1, height - viewport + header));
  return {
    progress,
    logoReveal: clamp((progress - 0.76) / 0.18),
    time: Math.min(progress / 0.76, 1) * Math.min(Math.max(0, duration - 0.05), 3.1),
  };
}
