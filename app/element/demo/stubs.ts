// One import point for the demo UI: thin re-exports of the real modules.
export type { BaseId, Family, Formula, Letter, Localised, Tier, Vial, VialContent } from "../../../lib/element/types";
export { BASES } from "../../../lib/element/bases";
export { kitKey } from "../../../lib/element/kit";
export { scoreLadder, type LadderAnswer } from "../../../lib/element/ladder";
export { displayPercents, tune, type Change, type Traits } from "../../../lib/element/tune";
export { compare } from "../../../lib/element/compare";
export { NOTE_TIER } from "../../../lib/element/graph";
export { nextFromBank, type SurveyState } from "../../../lib/element/survey";
export type { Question } from "../../../lib/element/survey-bank";
export { inferNose } from "../../../lib/element/nose";
export { loadOpenCv, readZone, type LidLayout, type ZoneResult } from "./photo-reader";
export { StyledQr } from "../styled-qr";
