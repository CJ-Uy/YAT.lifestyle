// Run with the browser_run_code_unsafe tool's filename argument.
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000");
  await page.locator(".language-select select").selectOption("en");
  assert(await page.locator(".hero-actions a").count() === 1, "Hero must have one action");
  assert(!await page.locator(".site-header").innerText().then(text => text.includes("Coming Soon")), "Header must link to Shop instead of announcing launch status");
  for (const locale of ["zh-Hant", "zh-Hans", "en"]) {
    await page.locator(".language-select select").selectOption(locale);
    await page.waitForFunction(locale => document.documentElement.lang === locale, locale);
    await page.locator(".shop-link").click();
    await page.waitForURL("**/shop");
    await page.waitForFunction(locale => document.documentElement.lang === locale, locale);
    assert(await page.locator(".shop-link").getAttribute("aria-current") === "page", "Shop must show current-page state");
    assert(await page.locator(".shop-page h1").count() === 1, "Shop must have a main heading");
    assert(await page.locator(".language-select select").inputValue() === locale, "Language must persist across pages");
    await page.locator(".shop-actions a").first().click();
    await page.waitForURL("**/#collections");
    await page.waitForFunction(locale => document.documentElement.lang === locale, locale);
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Home overflows at ${width}`);
    await page.goto("http://localhost:3000/shop");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Shop overflows at ${width}`);
    await page.goto("http://localhost:3000");
  }
  return "PASS: one hero action, shop navigation, three-language persistence, four responsive widths";
}
