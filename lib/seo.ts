import type { Metadata } from "next";
import { PRICE_CENTS, type Product } from "./shop.ts";

export const SITE_URL = "https://yatlifestyle.com";
export const LOCALES = ["en", "zh-Hant", "zh-Hans"] as const;
export type Locale = (typeof LOCALES)[number];

// English lives at the bare URL; the Chinese editions add ?lang= so each language has its own indexable address.
export function localeFromParam(value: unknown): Locale {
  const first = Array.isArray(value) ? value[0] : value;
  return LOCALES.find((locale) => locale === first) ?? "en";
}
export const localizedPath = (path: string, locale: Locale) => locale === "en" ? path : `${path}?lang=${locale}`;

const OG_IMAGE = { url: "/media/og-gift-box.jpg", width: 1200, height: 630, type: "image/jpeg" };
const OG_ALT = {
  en: "Blue YAT.LIFESTYLE gift box with a 10 mL perfume and artificial decorative flowers",
  "zh-Hant": "藍色 YAT.LIFESTYLE 禮盒，內有 10 mL 香水與人造裝飾花",
  "zh-Hans": "蓝色 YAT.LIFESTYLE 礼盒，内有 10 mL 香水与人造装饰花",
};

export const PAGE_COPY = {
  home: {
    en: { title: "YAT.LIFESTYLE | Perfume", description: "Explore twelve unisex fragrances from YAT.LIFESTYLE. Each 10 mL perfume comes in a blue gift box with decorative flowers for HK$258, with free Hong Kong delivery." },
    "zh-Hant": { title: "YAT.LIFESTYLE | 香水", description: "探索 YAT.LIFESTYLE 十二款男女皆宜香水。每瓶 10 mL 香水附藍色花禮盒，HK$258，香港免費送貨。" },
    "zh-Hans": { title: "YAT.LIFESTYLE | 香水", description: "探索 YAT.LIFESTYLE 十二款男女皆宜香水。每瓶 10 mL 香水附蓝色花礼盒，HK$258，香港免费配送。" },
  },
  shop: {
    en: { title: "All fragrances | YAT.LIFESTYLE", description: "Find your scent among twelve unisex fragrances. Each 10 mL perfume includes a blue gift box with decorative flowers for HK$258, with free Hong Kong delivery." },
    "zh-Hant": { title: "全部香水 | YAT.LIFESTYLE", description: "從十二款男女皆宜香水中找到你的香氣。每瓶 10 mL 香水附藍色花禮盒，HK$258，香港免費送貨。" },
    "zh-Hans": { title: "全部香水 | YAT.LIFESTYLE", description: "从十二款男女皆宜香水中找到你的香气。每瓶 10 mL 香水附蓝色花礼盒，HK$258，香港免费配送。" },
  },
};

export function productCopy(product: Product, locale: Locale) {
  const { subtitle, notes } = product.copy[locale];
  const title = `${product.name} · ${subtitle} | YAT.LIFESTYLE`;
  if (locale === "en") return { title, description: `${subtitle}. ${notes}. 10 mL perfume in a blue gift box with flowers, HK$258 with free Hong Kong delivery.` };
  if (locale === "zh-Hant") return { title, description: `${subtitle}。${notes}。10 mL 香水附藍色花禮盒，HK$258，香港免費送貨。` };
  return { title, description: `${subtitle}。${notes}。10 mL 香水附蓝色花礼盒，HK$258，香港免费配送。` };
}

export function storeMetadata(path: string, locale: Locale, { title, description }: { title: string; description: string }): Metadata {
  const images = [{ ...OG_IMAGE, alt: OG_ALT[locale] }];
  return {
    title, description,
    alternates: {
      canonical: localizedPath(path, locale),
      languages: { en: path, "zh-Hant": localizedPath(path, "zh-Hant"), "zh-Hans": localizedPath(path, "zh-Hans"), "x-default": path },
    },
    openGraph: { type: "website", siteName: "YAT.LIFESTYLE", url: localizedPath(path, locale), title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

// Public shopping pages only: Element, admin, cart and checkout stay out of the index.
export function sitemapEntries(slugs: string[]) {
  return ["/", "/shop", ...slugs.map((slug) => `/shop/${slug}`)].flatMap((path) => {
    const languages = { ...Object.fromEntries(LOCALES.map((locale) => [locale, SITE_URL + localizedPath(path, locale)])), "x-default": SITE_URL + path };
    return LOCALES.map((locale) => ({ url: SITE_URL + localizedPath(path, locale), alternates: { languages } }));
  });
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": ORGANIZATION_ID, name: "YAT.LIFESTYLE", url: SITE_URL, logo: `${SITE_URL}/apple-touch-icon.png`, email: "care@yatlifestyle.com" },
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "YAT.LIFESTYLE", url: SITE_URL, inLanguage: [...LOCALES], publisher: { "@id": ORGANIZATION_ID } },
    ],
  };
}

// Only confirmed facts: price, currency and free Hong Kong-only delivery. No ratings, reviews or stock claims.
export function productJsonLd(product: Product, locale: Locale) {
  const url = SITE_URL + localizedPath(`/shop/${product.slug}`, locale);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${SITE_URL}/shop/${product.slug}#product`,
        name: product.name,
        description: product.copy[locale].description,
        image: [`${SITE_URL}/media/yat-official-gift-box.webp`, `${SITE_URL}/media/scents/${product.slug}.webp`],
        brand: { "@type": "Brand", name: "YAT.LIFESTYLE" },
        size: "10 mL",
        url,
        offers: {
          "@type": "Offer",
          url,
          price: (PRICE_CENTS / 100).toFixed(2),
          priceCurrency: "HKD",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@id": ORGANIZATION_ID },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "HKD" },
            shippingDestination: { "@type": "DefinedRegion", addressCountry: "HK" },
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: PAGE_COPY.shop[locale].title.split(" | ")[0], item: SITE_URL + localizedPath("/shop", locale) },
          { "@type": "ListItem", position: 2, name: product.name, item: url },
        ],
      },
    ],
  };
}

// Escape "<" so copy can never close the surrounding <script> element.
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
