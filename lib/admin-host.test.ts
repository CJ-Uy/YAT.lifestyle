import assert from "node:assert/strict";
import { test } from "node:test";
import { adminHostRoute } from "./admin-host.ts";

test("admin host: admin only answers on admin.yatlifestyle.com and localhost", () => {
  for (const host of ["yatlifestyle.com", "www.yatlifestyle.com", "yat-lifestyle-prod.example.workers.dev"]) {
    assert.equal(adminHostRoute(host, "/admin"), "not-found");
    assert.equal(adminHostRoute(host, "/api/admin/login"), "not-found");
    assert.equal(adminHostRoute(host, "/shop"), "next");
    assert.equal(adminHostRoute(host, "/api/commerce/quote"), "next");
  }
  assert.equal(adminHostRoute("admin.yatlifestyle.com", "/"), "rewrite-admin");
  assert.equal(adminHostRoute("admin.yatlifestyle.com", "/api/admin/login"), "next");
  assert.equal(adminHostRoute("admin.yatlifestyle.com", "/_next/static/app.js"), "next");
  assert.equal(adminHostRoute("admin.yatlifestyle.com", "/shop"), "not-found");
  assert.equal(adminHostRoute("localhost", "/admin"), "next");
});
