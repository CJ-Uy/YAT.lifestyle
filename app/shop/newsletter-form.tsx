"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Locale } from "../site-header";
import { NEWSLETTER_POLICY_VERSION, newsletterCopy } from "../../lib/newsletter";

export default function NewsletterForm({ locale }: { locale: Locale }) {
  const t = newsletterCopy[locale];
  const [state, setState] = useState<"idle" | "sending" | "success" | "invalid" | "rate" | "error" | "timeout">("idle");
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  const pending = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    const data = new FormData(event.currentTarget);
    setState("sending");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const result = await fetch("/api/newsletter", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ email: data.get("email"), website: data.get("website"), locale,
          marketingConsent: data.get("marketing") === "on", privacyAcknowledged: data.get("privacy") === "on", policyVersion: NEWSLETTER_POLICY_VERSION }),
      });
      setState(result.ok ? "success" : result.status === 429 ? "rate" : result.status === 400 ? "invalid" : "error");
    } catch { setState(controller.signal.aborted ? "timeout" : "error"); }
    finally { clearTimeout(timer); pending.current = false; }
  }
  return <section className="newsletter" aria-labelledby="newsletter-heading">
    <h2 id="newsletter-heading">{t.title}</h2>
    <p className="newsletter-intro">{t.intro}</p>
    <form method="post" action="/api/newsletter" onSubmit={submit} aria-busy={state === "sending"}>
      <fieldset disabled={!ready || state === "sending" || state === "success"}>
        <label htmlFor="newsletter-email">{t.email}</label>
        <input id="newsletter-email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required aria-describedby="newsletter-notice" />
        <div className="newsletter-trap" aria-hidden="true"><label htmlFor="newsletter-website">Website</label><input id="newsletter-website" name="website" tabIndex={-1} autoComplete="off" /></div>
        <label className="newsletter-check"><input name="marketing" type="checkbox" required /><span>{t.consent}</span></label>
        <label className="newsletter-check"><input name="privacy" type="checkbox" required /><span>{t.acknowledgement} <a href="/privacy" target="_blank" rel="noopener">{t.privacy}</a>.</span></label>
        <button type="submit">{state === "sending" ? t.sending : t.submit}</button>
      </fieldset>
      <p className={`newsletter-result ${state}`} role="status" aria-live="polite" aria-atomic="true">{state !== "idle" && state !== "sending" ? t[state] : ""}</p>
    </form>
    <noscript><p>{locale === "en" ? "Please enable JavaScript to use the signup form." : locale === "zh-Hant" ? "請啟用 JavaScript 以使用訂閱表格。" : "请启用 JavaScript 以使用订阅表单。"}</p></noscript>
    <p id="newsletter-notice" className="newsletter-notice">{t.notice}</p>
  </section>;
}
