import type { BaseId, Family } from "../../../lib/element/types";

export const CARD_FAMILIES: Family[] = ["citrus", "green", "water", "floral", "woody", "amber"];
export type FamilyValues = Record<Family, number>;
export type MemoryCollection = "mine" | "people";
export type ScentMemory = {
  id: string;
  person: string;
  note: string;
  base: BaseId;
  likes: FamilyValues;
  collection: MemoryCollection;
  createdAt: string;
  example?: boolean;
};
export const MEMORY_KEY = "element-demo-scent-memories-v1";
const BASE_IDS = new Set(["dawn", "tea", "harbour", "noon", "forest", "night"]);

export function familyValues(values: Partial<FamilyValues>): FamilyValues {
  return Object.fromEntries(CARD_FAMILIES.map(family => {
    const value = values[family];
    return [family, typeof value === "number" && Number.isFinite(value) ? Math.min(5, Math.max(1, value)) : 3];
  })) as FamilyValues;
}

/** A visual signature, never a substitute for the real QR beside it. */
export function signatureBars(values: FamilyValues) {
  return CARD_FAMILIES.flatMap((family, index) => {
    const value = familyValues(values)[family];
    return [0, 1, 2, 3, 4].map(offset => ({
      x: 8 + (index * 5 + offset) * 8,
      height: 8 + value * 5 + Math.sin((offset + 1) * (index + 2)) * 5,
      family,
    }));
  });
}

/** Treat browser storage as untrusted data, including old versions. */
export function parseMemories(raw: string | null): ScentMemory[] {
  if (!raw) return [];
  try {
    const rows: unknown = JSON.parse(raw);
    if (!Array.isArray(rows)) return [];
    const result: ScentMemory[] = [];
    const ids = new Set<string>();
    for (const row of rows.slice(0, 100)) {
      if (!row || typeof row !== "object") continue;
      const m = row as Record<string, unknown>;
      if (typeof m.id !== "string" || !/^[a-z0-9-]{1,100}$/i.test(m.id) || ids.has(m.id)
        || typeof m.person !== "string" || !m.person.trim() || m.person.length > 80
        || typeof m.note !== "string" || m.note.length > 500
        || typeof m.base !== "string" || !BASE_IDS.has(m.base)
        || (m.collection !== "mine" && m.collection !== "people")
        || typeof m.createdAt !== "string" || Number.isNaN(Date.parse(m.createdAt))
        || !m.likes || typeof m.likes !== "object") continue;
      const likes = m.likes as Partial<FamilyValues>;
      if (!CARD_FAMILIES.every(family => typeof likes[family] === "number" && Number.isFinite(likes[family]) && likes[family]! >= 1 && likes[family]! <= 5)) continue;
      result.push({ id: m.id, person: m.person, note: m.note, base: m.base as BaseId, likes: familyValues(likes), collection: m.collection, createdAt: m.createdAt, example: m.example === true });
      ids.add(m.id);
    }
    return result;
  } catch { return []; }
}

export function confirmedProfileId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9-]{1,40}$/.test(value);
}

export const FOUNDER_VECTOR = {
  likes: { citrus: 3, green: 5, water: 3, floral: 5, woody: 3, amber: 2 } as FamilyValues,
  tags: ["trail-memory", "aircon-office"],
};

export const EXAMPLE_FRIENDS = [
  { id: "mei", name: "Mei", base: "tea" as BaseId, likes: { citrus: 3, green: 5, water: 3, floral: 4, woody: 3, amber: 2 } as FamilyValues },
  { id: "alex", name: "Alex", base: "forest" as BaseId, likes: { citrus: 2, green: 3, water: 2, floral: 2, woody: 5, amber: 4 } as FamilyValues },
];
