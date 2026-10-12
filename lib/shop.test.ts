import assert from "node:assert/strict";
import { test } from "node:test";
import { cartSubtotal, DELIVERY_CENTS, formatPrice, normalizeCart, PRICE_CENTS, productBySlug, PRODUCTS } from "./shop.ts";

test("shop: twelve unique products have three-language copy and stable IDs", () => {
  assert.equal(PRODUCTS.length, 12);
  assert.equal(new Set(PRODUCTS.map((product) => product.slug)).size, 12);
  for (const product of PRODUCTS) {
    assert.equal(productBySlug(product.slug), product);
    assert.match(product.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(product.families.length);
    for (const copy of Object.values(product.copy)) {
      assert.ok(copy.subtitle.trim());
      assert.ok(copy.notes.trim());
      assert.ok(copy.description.trim());
      assert.doesNotMatch(JSON.stringify(copy), /CW -|CS -|TDB -|\d+%|\d+(?:\.\d+)?\s*mL/);
    }
  }
  for (const slug of ["unknown", "__proto__", "constructor", "Midnight", " midnight", "high tea"]) {
    assert.equal(productBySlug(slug), undefined);
  }
  assert.equal(productBySlug("white")?.copy["zh-Hant"].subtitle, "鈴蘭與白麝香");
  assert.equal(productBySlug("white")?.copy["zh-Hans"].subtitle, "铃兰与白麝香");
});

test("cart: untrusted storage cannot add unknown products, coerce quantities or override prices", () => {
  for (const value of [null, undefined, "[]", {}, 1, true]) assert.deepEqual(normalizeCart(value), []);
  assert.deepEqual(normalizeCart([
    null, false, [], "midnight", {},
    { slug: "missing", quantity: 2 },
    { slug: "__proto__", quantity: 1 },
    { slug: "midnight", quantity: "2" },
    { slug: "midnight", quantity: 0 },
    { slug: "midnight", quantity: -1 },
    { slug: "midnight", quantity: 1.5 },
    { slug: "midnight", quantity: Infinity },
    { slug: "midnight", quantity: NaN },
    { slug: "midnight", quantity: Number.MAX_SAFE_INTEGER + 1 },
    { slug: "golden", quantity: 2, price: 1, priceCents: 1, name: "Other" },
  ]), [{ slug: "golden", quantity: 2 }]);
  assert.equal(cartSubtotal([{ slug: "golden", quantity: 2, priceCents: 1 }]), 45600);
  assert.equal(cartSubtotal([{ slug: "missing", quantity: 100 }]), 0);
});

test("cart: duplicate entries merge and quantities stay bounded without mutating input", () => {
  const input = [{ slug: "midnight", quantity: 3 }, { slug: "golden", quantity: 2 }, { slug: "midnight", quantity: 9 }];
  const before = structuredClone(input);
  assert.deepEqual(normalizeCart(input), [{ slug: "midnight", quantity: 10 }, { slug: "golden", quantity: 2 }]);
  assert.deepEqual(input, before);
  assert.deepEqual(normalizeCart([
    { slug: "midnight", quantity: 10 },
    { slug: "golden", quantity: 10 },
    { slug: "forest", quantity: 9 },
    { slug: "dark", quantity: 8 },
    { slug: "sunday", quantity: 2 },
  ]), [
    { slug: "midnight", quantity: 10 },
    { slug: "golden", quantity: 10 },
    { slug: "forest", quantity: 9 },
    { slug: "dark", quantity: 1 },
  ]);
  const maximum = normalizeCart(PRODUCTS.map((product) => ({ slug: product.slug, quantity: Number.MAX_SAFE_INTEGER })));
  assert.equal(maximum.reduce((count, item) => count + item.quantity, 0), 30);
  assert.equal(cartSubtotal(maximum), PRICE_CENTS * 30);
  assert.deepEqual(normalizeCart(maximum), maximum);
});

test("shop: money stays in cents and displays the intended Hong Kong price", () => {
  assert.equal(PRICE_CENTS, 22800);
  assert.equal(DELIVERY_CENTS, 3000);
  assert.equal(formatPrice(PRICE_CENTS), "HK$228");
  assert.equal(formatPrice(PRICE_CENTS + DELIVERY_CENTS), "HK$258");
  assert.equal(formatPrice(22850), "HK$228.50");
  assert.equal(formatPrice(0), "HK$0");
  for (const cents of [-1, 1.2, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => formatPrice(cents), RangeError);
  }
});
