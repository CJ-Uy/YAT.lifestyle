import type { Vial, VialContent } from "./types.ts";
export type LadderAnswer = { vial: Vial; smelled: boolean; strength: 0 | 1 | 2 | 3 };
export function scoreLadder(answers: LadderAnswer[], vials: Record<Vial, VialContent>) {
  const said = (c: VialContent) => answers.find((a) => vials[a.vial] === c)?.smelled;
  if (!answers.length) return { sensitivity: "unknown" as const, falseAlarm: false, missedStrong: false, trust: 0.5 };
  const falseAlarm = said("blank") === true, missedStrong = said("strong") === false;
  const sensitivity = said("weak") ? "high" as const : said("medium") ? "medium" as const : said("strong") ? "low" as const : "unknown" as const;
  return { sensitivity, falseAlarm, missedStrong, trust: falseAlarm || missedStrong ? 0.5 : 1 };
}
