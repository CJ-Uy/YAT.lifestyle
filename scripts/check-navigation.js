// Run with the browser_run_code_unsafe tool's filename argument.
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const checkEmails = async (names) => {
    const links = page.locator('a[href^="mailto:"]');
    assert(await links.count() === names.length, "Unexpected number of contact addresses");
    for (const name of names) {
      const address = `${name}@yatlifestyle.com`;
      const link = page.locator(`a[href="mailto:${address}"]`);
      assert(await link.count() === 1, `Missing ${address}`);
      assert((await link.innerText()).includes(address), `Address not visible: ${address}`);
    }
  };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000");
  const chooseLanguage = async (locale) => {
    await page.locator(".language-select summary").click();
    await page.locator(`.language-options button[lang="${locale}"]`).click();
    await page.waitForFunction(locale => document.documentElement.lang === locale, locale);
    assert(await page.locator(".language-select").getAttribute("open") === null, "Language menu must close after selection");
  };
  await chooseLanguage("en");
  assert(await page.locator(".scene-hero a").count() === 0, "Hero must not duplicate navigation actions");
  assert(await page.locator(".wordmark").innerText() === "", "Header must use the emblem without a text wordmark");
  assert(!await page.locator(".site-header").innerText().then(text => text.includes("Coming Soon")), "Header must link to Shop instead of announcing launch status");
  for (const locale of ["zh-Hant", "zh-Hans", "en"]) {
    await chooseLanguage(locale);
    await checkEmails(["hello", "element", "press"]);
    await page.locator(".shop-link").click();
    await page.waitForURL("**/shop");
    await page.waitForFunction(locale => document.documentElement.lang === locale, locale);
    assert(await page.locator(".shop-link").getAttribute("aria-current") === "page", "Shop must show current-page state");
    assert(await page.locator(".shop-page h1").count() === 1, "Shop must have a main heading");
    await checkEmails(["hello", "care", "orders"]);
    assert(await page.locator(`.language-options button[lang="${locale}"]`).getAttribute("aria-pressed") === "true", "Language must persist across pages");
    await page.locator(".shop-actions a").first().click();
    await page.waitForURL("**/#collections");
    await page.waitForFunction(locale => document.documentElement.lang === locale, locale);
  }
  await page.locator(".language-select summary").focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  assert(await page.locator(".language-options button").first().evaluate(el => el === document.activeElement), "Keyboard must reach language choices");
  await page.keyboard.press("Escape");
  assert(await page.locator(".language-select").getAttribute("open") === null, "Escape must close language choices");
  assert(await page.locator(".language-select summary").evaluate(el => el === document.activeElement), "Escape must restore trigger focus");
  await page.locator(".language-select summary").click();
  await page.locator(".wordmark").click();
  assert(await page.locator(".language-select").getAttribute("open") === null, "Outside click must close language choices");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Home overflows at ${width}`);
    const emblem = await page.locator(".wordmark").boundingBox();
    const inset = await page.locator(".site-header").evaluate(el => parseFloat(getComputedStyle(el).paddingLeft));
    assert(Math.abs(emblem.x - inset) < 2, `Emblem is not left-aligned at ${width}`);
    const heading = await page.locator(".scene-intro h2").boundingBox();
    const paragraph = await page.locator(".scene-intro p").boundingBox();
    assert(Math.abs(heading.x + heading.width / 2 - paragraph.x - paragraph.width / 2) < 2, `Story subtext is not centered at ${width}`);
    await page.locator(".language-select summary").click();
    const dropdown = await page.locator(".language-options").boundingBox();
    assert(dropdown.x >= 0 && dropdown.x + dropdown.width <= width, `Language menu overflows at ${width}`);
    await page.keyboard.press("Escape");
    await page.goto("http://localhost:3000/shop");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Shop overflows at ${width}`);
    await page.goto("http://localhost:3000");
  }
  return "PASS: contextual email links in three languages, header and story alignment, language controls, four responsive widths";
}
