export type Product = {
  slug: string;
  name: string;
  families: string[];
  copy: Record<"en" | "zh-Hant" | "zh-Hans", {
    subtitle: string;
    notes: string;
    description: string;
  }>;
};

export const PRICE_CENTS = 25800;
// Hong Kong delivery is included in the price.
export const DELIVERY_CENTS = 0;
export const MAX_PER_SCENT = 10;
export const MAX_BAG_COUNT = 30;

export const PRODUCTS: Product[] = [
  {
    "slug": "midnight",
    "name": "Midnight",
    "families": [
      "tea",
      "floral",
      "woody"
    ],
    "copy": {
      "en": {
        "subtitle": "Jasmine black tea",
        "notes": "Black tea accord, jasmine, neroli; fig and dry woody accents",
        "description": "Dark tea meets soft jasmine and neroli. Leafy citrus brightness and rounded fig-like detail sit against dry woods, giving the fragrance a floral tea character with depth."
      },
      "zh-Hant": {
        "subtitle": "茉莉紅茶",
        "notes": "紅茶香調、茉莉、橙花；無花果與乾燥木質",
        "description": "深沉的茶香配上柔和的茉莉與橙花。綠葉般的柑橘清新感、圓潤的無花果氣息與乾燥木質交織，呈現有層次的花香茶調。"
      },
      "zh-Hans": {
        "subtitle": "茉莉红茶",
        "notes": "红茶香调、茉莉、橙花；无花果与干燥木质",
        "description": "深沉的茶香配上柔和的茉莉与橙花。绿叶般的柑橘清新感、圆润的无花果气息与干燥木质交织，呈现有层次的花香茶调。"
      }
    }
  },
  {
    "slug": "golden",
    "name": "Golden",
    "families": [
      "fruity",
      "floral"
    ],
    "copy": {
      "en": {
        "subtitle": "Peach, pear & freesia",
        "notes": "Peach, pear, freesia; citrus, creamy musk",
        "description": "Juicy peach and pear meet delicate freesia. A little citrus brightness and a soft creamy musk backdrop give the fruit-and-flower pairing a rounded, playful character."
      },
      "zh-Hant": {
        "subtitle": "蜜桃、梨與小蒼蘭",
        "notes": "蜜桃、梨、小蒼蘭；柑橘與柔滑麝香",
        "description": "多汁的蜜桃與梨香遇上細緻的小蒼蘭。柑橘增添明亮感，柔滑的麝香襯托果香與花香，氣味圓潤而活潑。"
      },
      "zh-Hans": {
        "subtitle": "蜜桃、梨与小苍兰",
        "notes": "蜜桃、梨、小苍兰；柑橘与柔滑麝香",
        "description": "多汁的蜜桃与梨香遇上细致的小苍兰。柑橘增添明亮感，柔滑的麝香衬托果香与花香，气味圆润而活泼。"
      }
    }
  },
  {
    "slug": "forest",
    "name": "Forest",
    "families": [
      "woody",
      "aromatic"
    ],
    "copy": {
      "en": {
        "subtitle": "Sandalwood",
        "notes": "Sandalwood, cedar, cardamom; leather and powdery floral accents",
        "description": "Soft sandalwood and dry cedar form the center, with cardamom spice, a leather-like accent and a powdery floral edge. A textured woody scent with quiet warmth."
      },
      "zh-Hant": {
        "subtitle": "檀香",
        "notes": "檀香、雪松、小豆蔻；皮革與粉感花香",
        "description": "柔和檀香與乾燥雪松構成主軸，帶有小豆蔻辛香、皮革般氣息與輕柔粉感花香。木質有紋理，溫暖而沉靜。"
      },
      "zh-Hans": {
        "subtitle": "檀香",
        "notes": "檀香、雪松、小豆蔻；皮革与粉感花香",
        "description": "柔和檀香与干燥雪松构成主轴，带有小豆蔻辛香、皮革般气息与轻柔粉感花香。木质有纹理，温暖而沉静。"
      }
    }
  },
  {
    "slug": "dark",
    "name": "Dark",
    "families": [
      "tea",
      "woody",
      "aromatic"
    ],
    "copy": {
      "en": {
        "subtitle": "Black tea",
        "notes": "Black tea accord, fig, bergamot, cedar, vetiver; hay and tobacco accents",
        "description": "An aromatic tea impression with rounded fig-like sweetness and dry cedar and vetiver. Hay and tobacco accords add a darker, earthy character to the tea-and-woods profile."
      },
      "zh-Hant": {
        "subtitle": "紅茶",
        "notes": "紅茶香調、無花果、佛手柑、雪松、岩蘭草；乾草與煙草",
        "description": "芳香茶調帶有圓潤的無花果甜感，配上乾燥雪松與岩蘭草。乾草和煙草香調增添深沉、帶泥土感的氣息。"
      },
      "zh-Hans": {
        "subtitle": "红茶",
        "notes": "红茶香调、无花果、佛手柑、雪松、岩兰草；干草与烟草",
        "description": "芳香茶调带有圆润的无花果甜感，配上干燥雪松与岩兰草。干草和烟草香调增添深沉、带泥土感的气息。"
      }
    }
  },
  {
    "slug": "sunday",
    "name": "Sunday",
    "families": [
      "fruity",
      "floral"
    ],
    "copy": {
      "en": {
        "subtitle": "Pear & freesia",
        "notes": "Pear, freesia, rose; warm woody musk",
        "description": "Fresh pear and delicate freesia create an orchard-inspired floral scent. Rose and softly warm woody musk bring a gentle, rounded background to the bright fruit."
      },
      "zh-Hant": {
        "subtitle": "梨與小蒼蘭",
        "notes": "梨、小蒼蘭、玫瑰；溫暖木質麝香",
        "description": "清新梨香與細緻小蒼蘭呈現果園般的花果香。玫瑰和溫暖木質麝香在背景中柔和襯托明亮的果香。"
      },
      "zh-Hans": {
        "subtitle": "梨与小苍兰",
        "notes": "梨、小苍兰、玫瑰；温暖木质麝香",
        "description": "清新梨香与细致小苍兰呈现果园般的花果香。玫瑰和温暖木质麝香在背景中柔和衬托明亮的果香。"
      }
    }
  },
  {
    "slug": "freshly",
    "name": "Freshly",
    "families": [
      "floral",
      "green"
    ],
    "copy": {
      "en": {
        "subtitle": "Jasmine & mint",
        "notes": "Jasmine, mint, citrus; white flowers and musk",
        "description": "Jasmine and soft white flowers meet mint and a touch of citrus. The floral character feels bright and green, with musk lending a smooth background."
      },
      "zh-Hant": {
        "subtitle": "茉莉與薄荷",
        "notes": "茉莉、薄荷、柑橘；白花與麝香",
        "description": "茉莉與柔和白花結合薄荷及少許柑橘。花香明亮，帶清新的綠意，麝香則讓背景更加柔順。"
      },
      "zh-Hans": {
        "subtitle": "茉莉与薄荷",
        "notes": "茉莉、薄荷、柑橘；白花与麝香",
        "description": "茉莉与柔和白花结合薄荷及少许柑橘。花香明亮，带清新的绿意，麝香则让背景更加柔顺。"
      }
    }
  },
  {
    "slug": "ocean",
    "name": "Ocean",
    "families": [
      "marine",
      "floral"
    ],
    "copy": {
      "en": {
        "subtitle": "Sea salt & orchid",
        "notes": "Sea salt, airy ozone accord, freesia, green leaves; light musk and amber",
        "description": "An airy coastal floral with sea-salt and fresh-air accords, freesia and green leaves. Light musk and amber give the marine freshness a soft, warm background."
      },
      "zh-Hant": {
        "subtitle": "海鹽與蘭花",
        "notes": "海鹽、清新空氣香調、小蒼蘭、綠葉；柔和麝香與琥珀",
        "description": "輕盈的海岸花香，融合海鹽、清新空氣、小蒼蘭與綠葉香調。柔和麝香和琥珀為海洋清新感添上溫暖背景。"
      },
      "zh-Hans": {
        "subtitle": "海盐与兰花",
        "notes": "海盐、清新空气香调、小苍兰、绿叶；柔和麝香与琥珀",
        "description": "轻盈的海岸花香，融合海盐、清新空气、小苍兰与绿叶香调。柔和麝香和琥珀为海洋清新感添上温暖背景。"
      }
    }
  },
  {
    "slug": "quiet",
    "name": "Quiet",
    "families": [
      "green",
      "tea",
      "citrus"
    ],
    "copy": {
      "en": {
        "subtitle": "Green tea & citrus",
        "notes": "Green tea, lemon, mandarin, bergamot; jasmine and white musk",
        "description": "Green tea meets lemon, mandarin and bergamot brightness. Gentle jasmine and white-musk accents support a fresh, green tea character with a clean citrus edge."
      },
      "zh-Hant": {
        "subtitle": "綠茶與柑橘",
        "notes": "綠茶、檸檬、柑橘、佛手柑；茉莉與白麝香",
        "description": "綠茶結合檸檬、柑橘與佛手柑的明亮氣息。柔和茉莉與白麝香襯托清新的茶香，帶有乾淨的柑橘感。"
      },
      "zh-Hans": {
        "subtitle": "绿茶与柑橘",
        "notes": "绿茶、柠檬、柑橘、佛手柑；茉莉与白麝香",
        "description": "绿茶结合柠檬、柑橘与佛手柑的明亮气息。柔和茉莉与白麝香衬托清新的茶香，带有干净的柑橘感。"
      }
    }
  },
  {
    "slug": "pure",
    "name": "Pure",
    "families": [
      "musky",
      "powdery",
      "tea"
    ],
    "copy": {
      "en": {
        "subtitle": "White tea & white musk",
        "notes": "White musk, white tea; powdery flowers and citrus accents",
        "description": "Soft, powdery floral musk meets the brighter character of white tea. A touch of citrus lifts the pairing, creating a gentle musk-and-tea fragrance with an airy feel."
      },
      "zh-Hant": {
        "subtitle": "白茶與白麝香",
        "notes": "白麝香、白茶；粉感花香與柑橘",
        "description": "柔和、帶粉感的花香麝香遇上明亮白茶。少許柑橘讓氣味更輕盈，呈現溫柔的麝香茶調。"
      },
      "zh-Hans": {
        "subtitle": "白茶与白麝香",
        "notes": "白麝香、白茶；粉感花香与柑橘",
        "description": "柔和、带粉感的花香麝香遇上明亮白茶。少许柑橘让气味更轻盈，呈现温柔的麝香茶调。"
      }
    }
  },
  {
    "slug": "white",
    "name": "White",
    "families": [
      "floral",
      "green",
      "powdery"
    ],
    "copy": {
      "en": {
        "subtitle": "Lily of the valley & white musk",
        "notes": "Lily of the valley (muguet), jasmine-like green florals, white musk",
        "description": "Green lily-of-the-valley florals meet soft white musk. The muguet bouquet gives it a springlike character, while powdery floral accents soften the overall impression."
      },
      "zh-Hant": {
        "subtitle": "鈴蘭與白麝香",
        "notes": "鈴蘭、帶茉莉感的綠意花香、白麝香",
        "description": "清新綠意的鈴蘭花香配上柔和白麝香。花束般的鈴蘭帶來春日氣息，粉感花香讓整體更加柔和。"
      },
      "zh-Hans": {
        "subtitle": "铃兰与白麝香",
        "notes": "铃兰、带茉莉感的绿意花香、白麝香",
        "description": "清新绿意的铃兰花香配上柔和白麝香。花束般的铃兰带来春日气息，粉感花香让整体更加柔和。"
      }
    }
  },
  {
    "slug": "high-tea",
    "name": "High Tea",
    "families": [
      "tea",
      "floral",
      "woody"
    ],
    "copy": {
      "en": {
        "subtitle": "White tea, woods & flowers",
        "notes": "White tea, sandalwood, neroli, jasmine, pear, freesia, white musk",
        "description": "White tea and sandalwood meet neroli, jasmine, pear and freesia. White musk brings the tea, woods, fruit and flowers together in a soft, layered fragrance."
      },
      "zh-Hant": {
        "subtitle": "白茶、木質與花香",
        "notes": "白茶、檀香、橙花、茉莉、梨、小蒼蘭、白麝香",
        "description": "白茶與檀香結合橙花、茉莉、梨和小蒼蘭。白麝香將茶、木質、果香與花香串連，呈現柔和且豐富的層次。"
      },
      "zh-Hans": {
        "subtitle": "白茶、木质与花香",
        "notes": "白茶、檀香、橙花、茉莉、梨、小苍兰、白麝香",
        "description": "白茶与檀香结合橙花、茉莉、梨和小苍兰。白麝香将茶、木质、果香与花香串联，呈现柔和且丰富的层次。"
      }
    }
  },
  {
    "slug": "6am",
    "name": "6am",
    "families": [
      "woody",
      "fresh",
      "tea"
    ],
    "copy": {
      "en": {
        "subtitle": "Sandalwood, tea & coastal air",
        "notes": "Sandalwood, white tea, green-tea citrus, sea salt and orchid accord, white musk",
        "description": "Sandalwood gives a woody center to white tea, citrus-green tea and coastal floral accords. White musk softens the combination, suggesting fresh morning air with a warm woody background."
      },
      "zh-Hant": {
        "subtitle": "檀香、茶與海岸清新",
        "notes": "檀香、白茶、綠茶柑橘、海鹽與蘭花香調、白麝香",
        "description": "檀香為白茶、綠茶柑橘及海岸花香建立木質主軸。白麝香讓氣味更柔和，帶來晨間空氣般的清新與溫暖木質背景。"
      },
      "zh-Hans": {
        "subtitle": "檀香、茶与海岸清新",
        "notes": "檀香、白茶、绿茶柑橘、海盐与兰花香调、白麝香",
        "description": "檀香为白茶、绿茶柑橘及海岸花香建立木质主轴。白麝香让气味更柔和，带来晨间空气般的清新与温暖木质背景。"
      }
    }
  }
];

// Hong Kong districts as [id, English, Traditional Chinese, Simplified Chinese].
export const HK_DISTRICTS = [
  ["central-western", "Central & Western", "中西區", "中西区"], ["eastern", "Eastern", "東區", "东区"],
  ["southern", "Southern", "南區", "南区"], ["wan-chai", "Wan Chai", "灣仔區", "湾仔区"],
  ["kowloon-city", "Kowloon City", "九龍城區", "九龙城区"], ["kwun-tong", "Kwun Tong", "觀塘區", "观塘区"],
  ["sham-shui-po", "Sham Shui Po", "深水埗區", "深水埗区"], ["wong-tai-sin", "Wong Tai Sin", "黃大仙區", "黄大仙区"],
  ["yau-tsim-mong", "Yau Tsim Mong", "油尖旺區", "油尖旺区"], ["islands", "Islands", "離島區", "离岛区"],
  ["kwai-tsing", "Kwai Tsing", "葵青區", "葵青区"], ["north", "North", "北區", "北区"],
  ["sai-kung", "Sai Kung", "西貢區", "西贡区"], ["sha-tin", "Sha Tin", "沙田區", "沙田区"],
  ["tai-po", "Tai Po", "大埔區", "大埔区"], ["tsuen-wan", "Tsuen Wan", "荃灣區", "荃湾区"],
  ["tuen-mun", "Tuen Mun", "屯門區", "屯门区"], ["yuen-long", "Yuen Long", "元朗區", "元朗区"],
] as const;

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((product) => product.slug === slug);
}

const FREE = { en: "Free", "zh-Hant": "免費", "zh-Hans": "免费" } as const;
export function formatDelivery(cents: number, locale: keyof typeof FREE): string {
  return cents ? formatPrice(cents) : FREE[locale];
}

export function formatPrice(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new RangeError("Invalid price");
  return "HK$" + (cents / 100).toLocaleString("en-HK", {
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

export type CartItem = { slug: string; quantity: number };

export function normalizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const items: CartItem[] = [];
  let count = 0;
  for (const raw of value) {
    if (count === MAX_BAG_COUNT) break;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const { slug, quantity } = raw as Record<string, unknown>;
    if (typeof slug !== "string" || !productBySlug(slug) ||
      typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1) continue;
    const existing = items.find((item) => item.slug === slug);
    const added = Math.min(quantity, MAX_PER_SCENT - (existing?.quantity ?? 0), MAX_BAG_COUNT - count);
    if (added < 1) continue;
    if (existing) existing.quantity += added;
    else items.push({ slug, quantity: added });
    count += added;
  }
  return items;
}

export function cartSubtotal(items: unknown): number {
  return normalizeCart(items).reduce((total, item) => total + item.quantity * PRICE_CENTS, 0);
}
