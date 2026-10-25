import assert from "node:assert/strict";
import { test } from "node:test";
import { receiptMail, type OrderRow } from "./commerce.server.ts";
import { shippedMail } from "./admin-finance.server.ts";

const details = { name: "<b>Alex</b>", email: "alex@example.com", phone: "+85223456789", district: "kowloon-city", building: "Flat A & B", street: "", notes: "", country: "HK" as const };
const items = [{ slug: "midnight", name: "Midnight", quantity: 2, unitPriceCents: 25800, lineTotalCents: 51600 }];

test("emails: receipt shows thumbnails, district names and totals, and escapes customer text", () => {
  const order = { id: "f363ac15-82cd-495c-a2df-1000cece6844", locale: "en", items_json: JSON.stringify(items), details_json: JSON.stringify(details),
    subtotal_cents: 51600, discount_cents: 1000, voucher_code: "<X>", delivery_cents: 0, total_cents: 50600 } as OrderRow;
  const mail = receiptMail(order);
  assert.match(mail.html, /https:\/\/yatlifestyle\.com\/media\/scents\/email\/midnight-dark\.jpg/);
  assert.match(mail.html, /Jasmine black tea/);
  assert.match(mail.html, /Kowloon City, Hong Kong/);
  assert.match(mail.html, /&lt;b&gt;Alex&lt;\/b&gt;/);
  assert.match(mail.html, /Flat A &amp; B/);
  assert.match(mail.html, /Voucher · &lt;X&gt;/);
  assert.doesNotMatch(mail.html, /<b>Alex|<X>/);
  assert.match(mail.text, /Total paid: HK\$506\n/);
  assert.match(receiptMail({ ...order, locale: "zh-Hant" }).html, /香港九龍城區/);
  // Gmail dark-mode lock: blend styles are present, and no image sits inside a blend wrapper (it would be inverted).
  assert.match(mail.html, /u \+ \.body \.gb-s \{ background:#000; mix-blend-mode:screen; \}/);
  assert.doesNotMatch(mail.html, /class="gb-d">(?:(?!<\/div><\/div>)[^])*<img/);
});

test("emails: shipped mail keeps the plain-text format and escapes tracking details", () => {
  const mail = shippedMail("order-1", "en", "SF <Express>", "SF123", items, details);
  assert.match(mail.text, /Courier: SF <Express>\nTracking number: SF123\n\nMidnight × 2/);
  assert.match(mail.html, /SF &lt;Express&gt;/);
  assert.match(mail.html, /midnight-dark\.jpg/);
});
