export type JourneyScene = 0 | 1 | 2 | 3 | 4;

export type JourneyCopyOpacities = readonly [
  opening: number,
  prepared: number,
  nose: number,
  refinement: number,
  final: number,
];

export interface JourneyMotion {
  progress: number;
  papers: readonly [blot: number, skin: number, control: number];
  boardOpacity: number;
  boardScale: number;
  /** Material collapse, measured into the actual glass pipette footprint by the view. */
  boardMelt: number;
  boardLiquid: number;
  /** Horizontal compression: 1 is the full board, .16 its softened capsule. */
  boardTaper: number;
  pipetteOpacity: number;
  /** Separation from the tip, independent of the longer drop trajectory. */
  dropRelease: number;
  /** Normalised position along the DOM-defined path; settled at .92 progress. */
  dropProgress: number;
  /** Shape crossfade into the hanging drop in the supplied gold logo. */
  dropMorph: number;
  dropOpacity: number;
  signatureReveal: number;
  /** Opening, prepared, nose, refinement and final; never visible together. */
  scenes: JourneyCopyOpacities;
  activeScene: JourneyScene;
}

const clamp = (value: number): number => Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
const ease = (value: number): number => { const t = clamp(value); return 1 - (1 - t) ** 3; };
const phase = (progress: number, start: number, end: number): number => ease((progress - start) / (end - start));
const lerp = (from: number, to: number, progress: number): number => from + (to - from) * progress;
const copyWindow = (progress: number, enterStart: number, enterEnd: number, leaveStart: number, leaveEnd: number): number =>
  phase(progress, enterStart, enterEnd) * (1 - phase(progress, leaveStart, leaveEnd));

/** Invalid layout measurements leave the opening visible rather than jumping to the end. */
export function journeyProgress(rootTop: number, scrollDistance: number): number {
  if (!Number.isFinite(rootTop) || !Number.isFinite(scrollDistance) || scrollDistance <= 0) return 0;
  return clamp(-rootTop / scrollDistance);
}

/** Pure scroll recipe. Reversing the gesture reverses every material state. */
export function journeyMotion(input: number): JourneyMotion {
  const progress = clamp(input);
  const collapse = phase(progress, .31, .43);
  const signatureReveal = phase(progress, .82, .96);
  const copyOpacities: JourneyCopyOpacities = [
    1 - phase(progress, .255, .28),
    copyWindow(progress, .285, .305, .405, .43),
    copyWindow(progress, .435, .455, .565, .59),
    copyWindow(progress, .595, .615, .755, .78),
    phase(progress, .785, .805),
  ];
  const activeScene: JourneyScene = progress < .2825 ? 0 : progress < .4325 ? 1 : progress < .5925 ? 2 : progress < .7825 ? 3 : 4;

  return {
    progress,
    papers: [phase(progress, .03, .12), phase(progress, .12, .2), phase(progress, .2, .28)],
    boardOpacity: 1 - phase(progress, .375, .43),
    boardScale: lerp(1, .64, collapse),
    boardMelt: collapse,
    boardLiquid: phase(progress, .31, .395),
    boardTaper: lerp(1, .16, collapse),
    pipetteOpacity: phase(progress, .35, .43) * (1 - phase(progress, .49, .54)),
    dropRelease: phase(progress, .43, .47),
    dropProgress: phase(progress, .43, .92),
    dropMorph: phase(progress, .84, .92),
    dropOpacity: phase(progress, .39, .43) * (1 - phase(progress, .94, 1)),
    signatureReveal,
    scenes: copyOpacities,
    activeScene,
  };
}
