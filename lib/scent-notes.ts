import type { Product } from "./shop";

export const SCENT_STAGES = ["opening", "heart", "dryDown"] as const;
type ScentStage = typeof SCENT_STAGES[number];
type ScentNotes = Record<ScentStage, string>;
type Locale = keyof Product["copy"];

export const scentJourneyCopy: Record<Locale, { title: string; disclaimer: string; labels: ScentNotes }> = {
  en: {
    title: "Scent journey — draft",
    disclaimer: "Proposed sequence, inferred from the blend and reference fragrance-oil profiles. The maker still needs to confirm it on the finished perfume.",
    labels: { opening: "Top notes", heart: "Middle notes", dryDown: "Base notes" },
  },
  "zh-Hant": {
    title: "香氣旅程 · 草稿",
    disclaimer: "香氣順序根據配方與參考香精資料推測，仍待調配者以成品確認。",
    labels: { opening: "前調", heart: "中調", dryDown: "後調" },
  },
  "zh-Hans": {
    title: "香气旅程 · 草稿",
    disclaimer: "香气顺序根据配方与参考香精资料推测，仍待调配者以成品确认。",
    labels: { opening: "前调", heart: "中调", dryDown: "后调" },
  },
};

// Proposed facet order; finished-blend wear testing is still needed.
export const SCENT_NOTES: Record<string, Record<Locale, ScentNotes>> = {
  midnight: {
    en: { opening: "Leafy citrus · fig", heart: "Black tea · jasmine · neroli", dryDown: "Dry woods" },
    "zh-Hant": { opening: "綠葉柑橘 · 無花果", heart: "紅茶 · 茉莉 · 橙花", dryDown: "乾燥木質" },
    "zh-Hans": { opening: "绿叶柑橘 · 无花果", heart: "红茶 · 茉莉 · 橙花", dryDown: "干燥木质" },
  },
  golden: {
    en: { opening: "Peach · pear · citrus", heart: "Freesia · soft fruit", dryDown: "Creamy musk" },
    "zh-Hant": { opening: "蜜桃 · 梨 · 柑橘", heart: "小蒼蘭 · 柔和果香", dryDown: "柔滑麝香" },
    "zh-Hans": { opening: "蜜桃 · 梨 · 柑橘", heart: "小苍兰 · 柔和果香", dryDown: "柔滑麝香" },
  },
  forest: {
    en: { opening: "Cardamom · powdery florals", heart: "Sandalwood", dryDown: "Cedar · leather accord" },
    "zh-Hant": { opening: "小豆蔻 · 粉感花香", heart: "檀香", dryDown: "雪松 · 皮革香調" },
    "zh-Hans": { opening: "小豆蔻 · 粉感花香", heart: "檀香", dryDown: "雪松 · 皮革香调" },
  },
  dark: {
    en: { opening: "Bergamot · fig", heart: "Black tea · hay accord", dryDown: "Cedar · vetiver · tobacco accord" },
    "zh-Hant": { opening: "佛手柑 · 無花果", heart: "紅茶 · 乾草香調", dryDown: "雪松 · 岩蘭草 · 煙草香調" },
    "zh-Hans": { opening: "佛手柑 · 无花果", heart: "红茶 · 干草香调", dryDown: "雪松 · 岩兰草 · 烟草香调" },
  },
  sunday: {
    en: { opening: "Fresh pear", heart: "Freesia · rose", dryDown: "Warm woods · musk" },
    "zh-Hant": { opening: "清新梨香", heart: "小蒼蘭 · 玫瑰", dryDown: "溫暖木質 · 麝香" },
    "zh-Hans": { opening: "清新梨香", heart: "小苍兰 · 玫瑰", dryDown: "温暖木质 · 麝香" },
  },
  freshly: {
    en: { opening: "Mint · citrus", heart: "Jasmine · white flowers", dryDown: "Soft musk" },
    "zh-Hant": { opening: "薄荷 · 柑橘", heart: "茉莉 · 白花", dryDown: "柔和麝香" },
    "zh-Hans": { opening: "薄荷 · 柑橘", heart: "茉莉 · 白花", dryDown: "柔和麝香" },
  },
  ocean: {
    en: { opening: "Fresh-air accord · green leaves", heart: "Sea salt · freesia · marine florals", dryDown: "Light musk · amber" },
    "zh-Hant": { opening: "清新空氣香調 · 綠葉", heart: "海鹽 · 小蒼蘭 · 海洋花香", dryDown: "柔和麝香 · 琥珀" },
    "zh-Hans": { opening: "清新空气香调 · 绿叶", heart: "海盐 · 小苍兰 · 海洋花香", dryDown: "柔和麝香 · 琥珀" },
  },
  quiet: {
    en: { opening: "Lemon · mandarin · bergamot", heart: "Green tea · jasmine", dryDown: "White musk" },
    "zh-Hant": { opening: "檸檬 · 柑橘 · 佛手柑", heart: "綠茶 · 茉莉", dryDown: "白麝香" },
    "zh-Hans": { opening: "柠檬 · 柑橘 · 佛手柑", heart: "绿茶 · 茉莉", dryDown: "白麝香" },
  },
  pure: {
    en: { opening: "Citrus brightness", heart: "White tea · powdery flowers", dryDown: "White musk" },
    "zh-Hant": { opening: "明亮柑橘", heart: "白茶 · 粉感花香", dryDown: "白麝香" },
    "zh-Hans": { opening: "明亮柑橘", heart: "白茶 · 粉感花香", dryDown: "白麝香" },
  },
  white: {
    en: { opening: "Green floral freshness", heart: "Lily of the valley · jasmine-like florals", dryDown: "White musk · powdery florals" },
    "zh-Hant": { opening: "清新綠意花香", heart: "鈴蘭 · 帶茉莉感的花香", dryDown: "白麝香 · 粉感花香" },
    "zh-Hans": { opening: "清新绿意花香", heart: "铃兰 · 带茉莉感的花香", dryDown: "白麝香 · 粉感花香" },
  },
  "high-tea": {
    en: { opening: "Pear · citrus · neroli", heart: "White tea · jasmine · freesia", dryDown: "Sandalwood · white musk" },
    "zh-Hant": { opening: "梨 · 柑橘 · 橙花", heart: "白茶 · 茉莉 · 小蒼蘭", dryDown: "檀香 · 白麝香" },
    "zh-Hans": { opening: "梨 · 柑橘 · 橙花", heart: "白茶 · 茉莉 · 小苍兰", dryDown: "檀香 · 白麝香" },
  },
  "6am": {
    en: { opening: "Green-tea citrus · fresh-air accord", heart: "White tea · sea salt · coastal florals", dryDown: "Sandalwood · white musk" },
    "zh-Hant": { opening: "綠茶柑橘 · 清新空氣香調", heart: "白茶 · 海鹽 · 海岸花香", dryDown: "檀香 · 白麝香" },
    "zh-Hans": { opening: "绿茶柑橘 · 清新空气香调", heart: "白茶 · 海盐 · 海岸花香", dryDown: "檀香 · 白麝香" },
  },
};
