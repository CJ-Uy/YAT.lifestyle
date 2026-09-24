// Run with browser_run_code_unsafe's filename argument against the local dev server.
async (page) => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("http://localhost:3000");
    await page.waitForSelector('.journey-stage[data-idle="true"]', { timeout: 20000 });
    const light = page.locator(".hero-backlight");
    const state = () => light.evaluate(el => getComputedStyle(el).animationPlayState);
    const before = await light.evaluate(el => getComputedStyle(el).opacity);
    const heading = await page.locator(".scene-hero h1").boundingBox();
    await page.waitForFunction(previous => getComputedStyle(document.querySelector(".hero-backlight")).opacity !== previous, before);
    assert(await page.locator(".hero-edge-trace").count() === 0, "Tracing lines must be removed");
    assert(await light.evaluate(el => {
      const glow = el.parentElement;
      const stage = glow.closest(".journey-stage");
      const rect = glow.getBoundingClientRect();
      const css = getComputedStyle(stage);
      return glow.nextElementSibling?.matches(".journey-canvas")
        && Math.abs(rect.top + rect.height / 2 - stage.getBoundingClientRect().top - parseFloat(css.getPropertyValue("--drop-y"))) < 1
        && rect.width < parseFloat(css.getPropertyValue("--drop-width")) * 2.2;
    }), "Backlight must sit behind and remain confined to the drop");
    assert(JSON.stringify(heading) === JSON.stringify(await page.locator(".scene-hero h1").boundingBox()), "Idle light must not move the text");
    await page.getByRole("button", { name: "Pause ambient motion" }).click();
    assert(await state() === "paused", "Pause control must stop the backlight");
    await page.getByRole("button", { name: "Resume ambient motion" }).click();
    assert(await state() === "running", "Resume control must restart the backlight");
    await page.evaluate(() => window.scrollTo({ top: 24, behavior: "instant" }));
    await page.waitForSelector('.journey-stage[data-idle="false"]');
    assert(await page.locator(".hero-ambient").evaluate(el => getComputedStyle(el).opacity) === "0", "Light must disappear before the film advances");
    await page.locator("#about").scrollIntoViewIfNeeded();
    assert(await state() === "paused", "Offscreen light must stop");
    const photo = page.locator(".about-frame img");
    await photo.evaluate(img => img.decode());
    assert((await photo.getAttribute("src")).includes("hong-kong-beginning"), "About must have its own image");
    assert(await photo.evaluate(img => img.naturalWidth > 0), "About image must load");
    for (const [index, asset] of ["hours-clock-tower", "afterimage-morning-tea"].entries()) {
      const source = `/media/${asset}.webp`;
      assert(await page.locator(`#collection-${index + 1} img`).getAttribute("src") === source, "Collection must use its dedicated image");
      assert(await page.locator(`.scene-photo-${index + 1} img`).getAttribute("src") === source, "Scroll chapter must match its collection");
      assert(await page.locator(".journey-atmosphere").getAttribute("src") !== source, "Collection must not repeat the landing background");
    }
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
  return "PASS: desktop/mobile drop-only backlight pulse, stable text, pause/resume, scroll handoff, offscreen and simulated visibility pause, reduced motion, unique About image";
}
