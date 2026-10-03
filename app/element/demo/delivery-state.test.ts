import test from "node:test";
import assert from "node:assert/strict";
import { deliveryComplete, emptyDelivery, normaliseDelivery } from "./delivery-state.ts";

const example = { recipient: "Example Recipient", address: "Unit 3, Example House, 12 Example Street", extra: "", area: "kowloon", confirmed: false } as const;

test("delivery requires a nonblank recipient, address and Hong Kong area", () => {
  assert.equal(deliveryComplete(emptyDelivery), false);
  assert.equal(deliveryComplete(example), true);
  assert.equal(deliveryComplete({ ...example, recipient: " \t " }), false);
  assert.equal(deliveryComplete({ ...example, address: " \n " }), false);
  assert.equal(deliveryComplete({ ...example, area: "" }), false);
});

test("restoration supports older sessions and refuses invalid region or confirmation", () => {
  assert.deepEqual(normaliseDelivery(undefined), emptyDelivery);
  assert.deepEqual(normaliseDelivery(null), emptyDelivery);
  assert.equal(normaliseDelivery({ ...example, area: "overseas", confirmed: true }).confirmed, false);
  assert.equal(normaliseDelivery({ ...example, recipient: "", confirmed: true }).confirmed, false);
  assert.equal(normaliseDelivery({ confirmed: true }).confirmed, false);
});

test("a completed local preview restores its address and caps persisted field lengths", () => {
  assert.deepEqual(normaliseDelivery({ ...example, confirmed: true }), { ...example, confirmed: true });
  const restored = normaliseDelivery({ ...example, recipient: "A".repeat(120), address: "B".repeat(250), extra: "C".repeat(140) });
  assert.equal(restored.recipient.length, 80);
  assert.equal(restored.address.length, 180);
  assert.equal(restored.extra.length, 100);
});
