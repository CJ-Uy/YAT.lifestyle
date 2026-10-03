import assert from "node:assert/strict";
import test from "node:test";
import { BANK, BANNED, BANNED_ZH } from "./survey-bank.ts";
import { nextFromBank, validateAiChoice } from "./survey.ts";

test("survey: bank covers all topics in all languages", () => {
  for (const q of BANK) for (const l of ["en", "zh-Hant", "zh-Hans"] as const) assert.ok(q.text[l] && q.chips.every((c) => c.label[l]), q.id);
  assert.equal(new Set(BANK.map((q) => q.topic)).size, 6);
});

test("survey: bank shape, required questions and safe copy", () => {
  assert.ok(BANK.length >= 24);
  assert.equal(new Set(BANK.map((q) => q.id)).size, BANK.length);
  for (const t of ["routine", "climate", "activity", "social", "memory", "dislikes"])
    assert.ok(BANK.filter((q) => q.topic === t).length >= 4, t);
  const by = (id: string) => BANK.find((q) => q.id === id)!;
  assert.ok(by("weekday").chips.some((c) => c.id === "office" && c.tags.includes("office")));
  assert.deepEqual(by("aircon").followsFrom, { question: "weekday", chip: "office" });
  assert.ok(by("gym-time").followsFrom?.question === "gym");
  assert.ok(by("weekend").chips.some((c) => c.id === "hiking"));
  assert.deepEqual(by("trail").followsFrom, { question: "weekend", chip: "hiking" });
  for (const q of BANK) {
    if (q.followsFrom) for (const id of [q.followsFrom.chip].flat()) assert.ok(by(q.followsFrom.question).chips.some((c) => c.id === id), q.id);
    const copy = [q.text, ...q.chips.map((c) => c.label)].flatMap((l) => Object.values(l));
    for (const s of copy) {
      assert.ok(!s.includes("—"), `em dash in ${q.id}`);
      assert.ok(!BANNED.some((b) => s.toLowerCase().includes(b)), `banned word in ${q.id}`);
      assert.ok(!BANNED_ZH.some((b) => s.includes(b)), `banned Chinese word in ${q.id}`);
    }
  }
});

test("survey: follow-up comes next, then least-covered topic, stops at 12", () => {
  const state = { answered: [{ id: "weekday", text: "", chips: ["office"], tags: ["office"], source: "bank" as const }], aiFollowUps: 0 };
  assert.equal(nextFromBank(state)?.id, "aircon");
  const full = { answered: Array.from({ length: 12 }, (_, i) => ({ id: `q${i}`, text: "", chips: [], tags: [], source: "bank" as const })), aiFollowUps: 0 };
  assert.equal(nextFromBank(full), null);
});

test("survey: non-matching chip gives no follow-up; fresh start is routine; coverage rotates", () => {
  assert.equal(nextFromBank({ answered: [], aiFollowUps: 0 })?.topic, "routine");
  const a = (id: string, chips: string[]) => ({ id, text: "", chips, tags: [], source: "bank" as const });
  const next = nextFromBank({ answered: [a("weekday", ["remote"])], aiFollowUps: 0 });
  assert.notEqual(next?.id, "aircon");
  assert.notEqual(next?.topic, "routine");
  // never repeats, never offers an untriggered follow-up, and 12 bank-only answers cover each topic exactly twice
  const seen: ReturnType<typeof a>[] = [];
  for (let i = 0; i < 12; i++) {
    const q = nextFromBank({ answered: seen, aiFollowUps: 0 })!;
    assert.ok(q && !seen.some((s) => s.id === q.id) && !q.followsFrom);
    seen.push(a(q.id, ["untriggering-chip"]));
  }
  const counts = new Map<string, number>();
  for (const s of seen) { const topic = BANK.find((q) => q.id === s.id)!.topic; counts.set(topic, (counts.get(topic) ?? 0) + 1); }
  assert.deepEqual([...counts.values()], [2, 2, 2, 2, 2, 2]);
});

test("survey: gym-time follows both gym chips", () => {
  const a = (chip: string) => [{ id: "gym", text: "", chips: [chip], tags: [], source: "bank" as const }];
  assert.equal(nextFromBank({ answered: a("regular"), aiFollowUps: 0 })?.id, "gym-time");
  assert.equal(nextFromBank({ answered: a("sometimes"), aiFollowUps: 0 })?.id, "gym-time");
  assert.notEqual(nextFromBank({ answered: a("no"), aiFollowUps: 0 })?.id, "gym-time");
});

test("survey: AI output is validated; bad output returns null so the bank is used", () => {
  const state = { answered: [], aiFollowUps: 0 };
  assert.equal(validateAiChoice("not json", state, "en"), null);
  assert.equal(validateAiChoice({ followup: { text: "Do you have any health conditions?", chips: [] } }, state, "en"), null);
  assert.equal(validateAiChoice({ followup: { text: "x".repeat(200), chips: [] } }, state, "en"), null);
  assert.equal(validateAiChoice({ followup: { text: "Morning or evening runs?", chips: [{ id: "m", label: "Morning", tags: ["morning"] }] } }, { answered: [], aiFollowUps: 3 }, "en"), null);
  assert.equal(validateAiChoice({ questionId: "gym" }, state, "en")?.kind, "bank");
});

test("survey: AI follow-up accepted only when well formed", () => {
  const state = { answered: [], aiFollowUps: 0 };
  const chips = [{ id: "m", label: "Morning", tags: ["morning"] }, { id: "e", label: "Evening", tags: ["evening"] }];
  const ok = validateAiChoice({ followup: { text: "Morning or evening runs?", chips } }, state, "en");
  assert.equal(ok?.kind, "followup");
  assert.equal(validateAiChoice({ followup: { text: "Morning or evening runs?", chips: [chips[0], { id: "x", label: "Your salary band", tags: [] }] } }, state, "en"), null);
  assert.equal(validateAiChoice({ followup: { text: "Morning or evening runs?", chips: Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, label: `C${i}`, tags: [] })) } }, state, "en"), null);
  assert.equal(validateAiChoice({ questionId: "nope" }, state, "en"), null);
  const answered = [{ id: "gym", text: "", chips: ["regular"], tags: [], source: "bank" as const }];
  assert.equal(validateAiChoice({ questionId: "gym" }, { answered, aiFollowUps: 0 }, "en"), null);
  assert.equal(validateAiChoice({ questionId: "aircon" }, state, "en"), null);
});

test("survey: Chinese ban list and em dashes are rejected in AI output", () => {
  const state = { answered: [], aiFollowUps: 0 };
  const chips = [{ id: "a", label: "早上", tags: ["morning"] }, { id: "b", label: "晚上", tags: ["evening"] }];
  assert.equal(validateAiChoice({ followup: { text: "你早上還是晚上去跑步？", chips } }, state, "zh-Hant")?.kind, "followup");
  for (const [text, locale] of [["你有沒有健康方面的問題？", "zh-Hant"], ["你的月收入大概多少？", "zh-Hant"], ["你有宗教信仰吗？", "zh-Hans"], ["你的体重是多少？", "zh-Hans"], ["你需要看医生吗？", "zh-Hans"], ["你每月薪水多少？", "zh-Hans"]] as const)
    assert.equal(validateAiChoice({ followup: { text, chips } }, state, locale), null, text);
  for (const label of ["健康狀況", "工资", "體重", "醫生", "性取向"])
    assert.equal(validateAiChoice({ followup: { text: "你早上還是晚上去跑步？", chips: [chips[0], { id: "x", label, tags: [] }] } }, state, "zh-Hant"), null, label);
  const dash = "—";
  assert.equal(validateAiChoice({ followup: { text: `Morning ${dash} or evening?`, chips: [{ id: "m", label: "Morning", tags: [] }, { id: "e", label: "Evening", tags: [] }] } }, state, "en"), null);
  assert.equal(validateAiChoice({ followup: { text: "Morning or evening?", chips: [{ id: "m", label: `Morning ${dash} early`, tags: [] }, { id: "e", label: "Evening", tags: [] }] } }, state, "en"), null);
});

test("survey: an AI follow-up that repeats a question or its answer set is rejected", () => {
  const places = ["Home", "Office", "Outdoors"];
  const asked = { id: "ai-1", text: "Where do you apply perfume?", chips: ["home"], tags: [], source: "ai" as const, options: places, picked: ["Home"] };
  const state = { answered: [asked], aiFollowUps: 1 };
  const chips = (labels: string[]) => labels.map((label, i) => ({ id: `c${i}`, label, tags: [] }));
  // The live near-duplicate: a new wording with the same options, in any order or case.
  assert.equal(validateAiChoice({ followup: { text: "Where do you spend most time?", chips: chips(["outdoors", "Home", "office"]) } }, state, "en"), null);
  assert.equal(validateAiChoice({ followup: { text: "where do you apply perfume", chips: chips(["Wrists", "Neck"]) } }, state, "en"), null);
  assert.equal(validateAiChoice({ followup: { text: "Which room at home?", chips: chips(["Bedroom", "Living room"]) } }, state, "en")?.kind, "followup");
  // Re-offering any answer already shown (live: "Home office" twice in a row) is rejected too.
  assert.equal(validateAiChoice({ followup: { text: "Which room at home?", chips: chips(["Bedroom", "office"]) } }, state, "en"), null);
  // Bank questions are checked against their own chip labels when the client sends none.
  const weekday = BANK.find((q) => q.id === "weekday")!;
  const bankState = { answered: [{ id: "weekday", text: weekday.text["zh-Hant"], chips: [], tags: [], source: "bank" as const }], aiFollowUps: 0 };
  assert.equal(validateAiChoice({ followup: { text: "你平日多數在哪裡？", chips: weekday.chips.map((c, i) => ({ id: `c${i}`, label: c.label["zh-Hant"], tags: [] })) } }, bankState, "zh-Hant"), null);
});

test("survey: AI choices are rejected once 12 questions are answered", () => {
  const answered = Array.from({ length: 12 }, (_, i) => ({ id: `q${i}`, text: "", chips: [], tags: [], source: "bank" as const }));
  const state = { answered, aiFollowUps: 0 };
  assert.equal(validateAiChoice({ questionId: "gym" }, state, "en"), null);
  assert.equal(validateAiChoice({ followup: { text: "Morning or evening?", chips: [{ id: "m", label: "Morning", tags: [] }, { id: "e", label: "Evening", tags: [] }] } }, state, "en"), null);
});