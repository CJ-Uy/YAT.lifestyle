// Run with browser_run_code_unsafe's filename argument against the local dev server.
async (page) => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("http://localhost:3000");
    await page.waitForSelector('.journey-stage[data-idle="true"]', { timeout: 20000 });
    const trace = page.locator(".hero-edge-trace").first();
    const state = () => trace.evaluate(el => getComputedStyle(el).animationPlayState);
    const before = await trace.evaluate(el => getComputedStyle(el).strokeDashoffset);
    const heading = await page.locator(".scene-hero h1").boundingBox();
    await page.waitForFunction(previous => getComputedStyle(document.querySelector(".hero-edge-trace")).strokeDashoffset !== previous, before);
    assert(JSON.stringify(heading) === JSON.stringify(await page.locator(".scene-hero h1").boundingBox()), "Idle light must not move the text");
    await page.getByRole("button", { name: "Pause ambient motion" }).click();
    assert(await state() === "paused", "Pause control must stop the edge light");
    await page.getByRole("button", { name: "Resume ambient motion" }).click();
    assert(await state() === "running", "Resume control must restart the edge light");
    await page.evaluate(() => window.scrollTo({ top: 24, behavior: "instant" }));
    await page.waitForSelector('.journey-stage[data-idle="false"]');
    assert(await page.locator(".hero-ambient").evaluate(el => getComputedStyle(el).opacity) === "0", "Light must disappear before the film advances");
    await page.locator("#about").scrollIntoViewIfNeeded();
    assert(await state() === "paused", "Offscreen light must stop");
    const photo = page.locator(".about-frame img");
    await photo.evaluate(img => img.decode());
    assert((await photo.getAttribute("src")).includes("hong-kong-beginning"), "About must have its own image");
    assert(await photo.evaluate(img => img.naturalWidth > 0), "About image must load");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForSelector('.journey-stage[data-idle="true"]');
    // Simulate the browser visibility event without relying on a headed tab switch.
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    assert(await state() === "paused", "Hidden document must pause the light");
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForSelector('.journey-stage[data-idle="true"]');
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForSelector(".journey-stage.is-still");
    assert(!await page.locator(".hero-ambient").isVisible(), "Reduced motion must hide the light");
    assert(await page.locator(".ambient-control").count() === 0, "Reduced motion must not show an irrelevant pause control");
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), "No horizontal overflow");
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  return "PASS: desktop/mobile light travel, stable text, pause/resume, scroll handoff, offscreen and simulated visibility pause, reduced motion, unique About image";
}
