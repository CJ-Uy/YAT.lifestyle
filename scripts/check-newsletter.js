// Run with the Playwright browser tool's filename option against the local dev server.
async (page) => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  await page.goto("http://localhost:3000/shop");
  await page.evaluate(() => localStorage.setItem("yat-language", "en"));
  await page.reload();
  await page.waitForFunction(() => !document.querySelector(".newsletter fieldset").disabled, {}, { timeout: 15000 });
  assert(await page.locator("input[type=checkbox]:checked").count() === 0, "Consent must start unchecked");
  await page.locator("#newsletter-email").fill("newsletter-browser-check@example.com");
  await page.locator(".newsletter button").click();
  assert(await page.locator("[name=marketing]").evaluate((el) => !el.validity.valid), "Missing consent must block submission");
  await page.locator("[name=marketing]").check();
  await page.locator("[name=privacy]").check();
  assert(await page.locator(".newsletter form").getAttribute("method") === "post", "Email must never enter a GET URL");
  for (const status of [429, 503]) {
    await page.route("**/api/newsletter", (route) => route.fulfill({ status, contentType: "application/json", body: '{"ok":false}' }));
    await page.locator(".newsletter button").click();
    await page.waitForFunction((state) => document.querySelector(".newsletter-result").classList.contains(state), status === 429 ? "rate" : "error", { timeout: 5000 });
    assert(await page.locator("#newsletter-email").inputValue() === "newsletter-browser-check@example.com", "Retry must preserve email");
    assert(await page.locator("input[type=checkbox]:checked").count() === 2, "Retry must preserve choices");
    await page.unroute("**/api/newsletter");
  }
  await page.locator(".newsletter button").click();
  await page.waitForFunction(() => document.querySelector(".newsletter-result").classList.contains("success"), {}, { timeout: 20000 });
  assert(await page.locator(".newsletter button").isDisabled(), "Success must prevent repeat clicks");
  assert(!page.url().includes("@"), "Email must not appear in URL");
  for (const locale of ["en", "zh-Hant", "zh-Hans"]) {
    await page.evaluate((value) => localStorage.setItem("yat-language", value), locale);
    await page.goto("http://localhost:3000/shop");
    await page.waitForFunction((value) => document.documentElement.lang === value && !document.querySelector(".newsletter fieldset").disabled, locale, { timeout: 15000 });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale} overflows at ${width}`);
    }
    await page.goto("http://localhost:3000/privacy");
    await page.waitForFunction((value) => document.documentElement.lang === value, locale, { timeout: 15000 });
    assert(await page.locator("main section").count() === 7, "Privacy policy sections missing");
    assert(await page.locator('.shop-link[aria-current="page"]').count() === 0, "Privacy is not the Shop page");
    assert(await page.locator('.primary-nav a[href="/#collections"]').count() === 1, "Privacy navigation must link home");
  }
  await page.evaluate(() => localStorage.setItem("yat-language", "en"));
  return "PASS: unchecked consent, validation, rate and failure recovery, real local D1 signup, duplicate-click prevention, all languages, 320-1440px layouts and privacy navigation";
}
