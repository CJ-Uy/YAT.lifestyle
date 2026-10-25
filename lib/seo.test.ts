import assert from "node:assert/strict";
import { test } from "node:test";
import { PRODUCTS } from "./shop.ts";
import { jsonLd, localeFromParam, productJsonLd, sitemapEntries, storeMetadata } from "./seo.ts";

test("seo: only known languages select a Chinese edition", () => {
  assert.equal(localeFromParam("zh-Hant"), "zh-Hant");
  assert.equal(localeFromParam(["zh-Hans", "en"]), "zh-Hans");
  for (const value of [undefined, "", "fr", "zh-hant", "__proto__", ["x"]]) assert.equal(localeFromParam(value), "en");
});

test("seo: every edition is canonical to itself and lists all hreflang alternates", () => {
  const meta = storeMetadata("/shop", "zh-Hant", { title: "t", description: "d" });
  assert.equal(meta.alternates?.canonical, "/shop?lang=zh-Hant");
  assert.deepEqual(meta.alternates?.languages, { en: "/shop", "zh-Hant": "/shop?lang=zh-Hant", "zh-Hans": "/shop?lang=zh-Hans", "x-default": "/shop" });
  assert.equal(storeMetadata("/", "en", { title: "t", description: "d" }).alternates?.canonical, "/");
});

test("seo: sitemap lists home, shop and twelve scents in three languages, nothing private", () => {
  const entries = sitemapEntries(PRODUCTS.map((product) => product.slug));
  assert.equal(entries.length, 14 * 3);
  assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length);
  assert.ok(entries.every((entry) => entry.url.startsWith("https://yatlifestyle.com/") && Object.keys(entry.alternates.languages).length === 4));
  assert.doesNotMatch(JSON.stringify(entries), /element|admin|bag|checkout|order/);
});

test("seo: product data states only the confirmed price and free Hong Kong delivery", () => {
  const data = productJsonLd(PRODUCTS[0], "en");
  const product = data["@graph"][0] as { offers: { price: string; priceCurrency: string; shippingDetails: { shippingRate: { value: number }; shippingDestination: { addressCountry: string } } } };
  assert.equal(product.offers.price, "258.00");
  assert.equal(product.offers.priceCurrency, "HKD");
  assert.equal(product.offers.shippingDetails.shippingRate.value, 0);
  assert.equal(product.offers.shippingDetails.shippingDestination.addressCountry, "HK");
  assert.doesNotMatch(JSON.stringify(data), /aggregateRating|review|ratingValue|availability/);
  assert.equal(jsonLd({ copy: "</script><b>" }), '{"copy":"\\u003c/script>\\u003cb>"}');
});
