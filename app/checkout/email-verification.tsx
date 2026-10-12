"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "../site-header";
import "./email-verification.css";

const copy = {
  en: {
    title: "Verify your email", intro: "Receive your order confirmation here.", send: "Send verification code", sending: "Sending…", checking: "Checking verification…",
    code: "Six-digit code", verify: "Verify email", verifying: "Verifying…", resend: "Resend code", verified: "Email verified", sent: "Check your email. The code expires in 10 minutes.",
    wait: "Please wait before requesting another code.", invalidEmail: "Enter a valid email address above.", invalidCode: "That code is invalid or expired. Try again, or request a new code.",
    sendFailed: "The code could not be sent. Please try again.", unavailable: "Email verification is unavailable. Please try again shortly.", expired: "Email verification expired. Request a new code.",
  },
  "zh-Hant": {
    title: "驗證電郵", intro: "訂單確認將寄到此電郵。", send: "寄送驗證碼", sending: "正在寄送…", checking: "正在檢查驗證…",
    code: "六位數驗證碼", verify: "驗證電郵", verifying: "正在驗證…", resend: "重新寄送", verified: "電郵已驗證", sent: "請查看電郵，驗證碼於 10 分鐘內有效。",
    wait: "請稍候再要求另一組驗證碼。", invalidEmail: "請在上方輸入有效電郵地址。", invalidCode: "驗證碼無效或已過期。請再試一次，或要求新的驗證碼。",
    sendFailed: "未能寄送驗證碼，請再試一次。", unavailable: "暫時無法驗證電郵，請稍後再試。", expired: "電郵驗證已過期，請要求新的驗證碼。",
  },
  "zh-Hans": {
    title: "验证邮箱", intro: "订单确认将发送到此邮箱。", send: "发送验证码", sending: "正在发送…", checking: "正在检查验证…",
    code: "六位数验证码", verify: "验证邮箱", verifying: "正在验证…", resend: "重新发送", verified: "邮箱已验证", sent: "请查看邮件，验证码在 10 分钟内有效。",
    wait: "请稍候再获取另一组验证码。", invalidEmail: "请在上方输入有效邮箱地址。", invalidCode: "验证码无效或已过期。请再试一次，或获取新的验证码。",
    sendFailed: "未能发送验证码，请再试一次。", unavailable: "暂时无法验证邮箱，请稍后再试。", expired: "邮箱验证已过期，请获取新的验证码。",
  },
};
type Phase = "idle" | "checking" | "sending" | "sent" | "verifying" | "verified";
type Feedback = "sent" | "wait" | "invalidEmail" | "invalidCode" | "sendFailed" | "unavailable" | "expired" | null;
type Reply = { ok?: boolean; email?: string | null; error?: string; resendAfter?: number; expiresIn?: number };

export function EmailVerification({ email, locale, onVerified }: { email: string; locale: Locale; onVerified: (email: string | null) => void }) {
  const t = copy[locale], normalizedEmail = email.trim().toLowerCase();
  const eligible = normalizedEmail.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const [phase, setPhase] = useState<Phase>("idle"), [feedback, setFeedback] = useState<Feedback>(null);
  const [code, setCode] = useState(""), [resendAt, setResendAt] = useState(0), [now, setNow] = useState(Date.now);
  const [verifiedUntil, setVerifiedUntil] = useState(0);
  const id = useId(), input = useRef<HTMLInputElement>(null), active = useRef<AbortController | null>(null);
  const verifiedCallback = useRef(onVerified);
  useEffect(() => { verifiedCallback.current = onVerified; }, [onVerified]);

  useEffect(() => {
    active.current?.abort();
    setCode(""); setResendAt(0); setVerifiedUntil(0); setFeedback(null); setPhase(eligible ? "checking" : "idle");
    verifiedCallback.current(null);
    const controller = new AbortController();
    active.current = controller;
    const timer = eligible ? setTimeout(async () => {
      try {
        const response = await fetch("/api/checkout-email/status", { credentials: "same-origin", signal: controller.signal });
        const data = await response.json() as Reply;
        if (controller.signal.aborted) return;
        if (response.ok && data.ok === true && data.email === normalizedEmail && data.expiresIn && data.expiresIn > 0 && data.expiresIn <= 1800) {
          setPhase("verified"); setVerifiedUntil(Date.now() + data.expiresIn * 1000); verifiedCallback.current(normalizedEmail);
        } else { setPhase("idle"); if (!response.ok) setFeedback("unavailable"); }
      } catch { if (!controller.signal.aborted) { setPhase("idle"); setFeedback("unavailable"); } }
    }, 400) : undefined;
    return () => { clearTimeout(timer); active.current?.abort(); };
  }, [normalizedEmail, eligible]);

  useEffect(() => {
    if (!resendAt) return;
    setNow(Date.now());
    const timer = setInterval(() => { const current = Date.now(); setNow(current); if (current >= resendAt) clearInterval(timer); }, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);
  useEffect(() => { if (phase === "sent" && feedback === "sent") input.current?.focus(); }, [phase, feedback]);
  useEffect(() => {
    if (!verifiedUntil) return;
    const timer = setTimeout(() => { verifiedCallback.current(null); setPhase("idle"); setVerifiedUntil(0); setResendAt(0); setFeedback("expired"); }, Math.max(0, verifiedUntil - Date.now()));
    return () => clearTimeout(timer);
  }, [verifiedUntil]);

  const busy = phase === "checking" || phase === "sending" || phase === "verifying";
  const remaining = Math.max(0, Math.ceil((resendAt - now) / 1000));
  async function submit(action: "request" | "verify") {
    if (busy || phase === "verified") return;
    if (!eligible) { setFeedback("invalidEmail"); return; }
    if (action === "verify" && !/^\d{6}$/.test(code)) { setFeedback("invalidCode"); return; }
    const controller = new AbortController();
    active.current?.abort(); active.current = controller;
    setPhase(action === "request" ? "sending" : "verifying"); setFeedback(null);
    try {
      const response = await fetch(`/api/checkout-email/${action}`, { method: "POST", credentials: "same-origin", signal: controller.signal,
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalizedEmail, locale, ...(action === "verify" ? { code } : {}) }) });
      const data = await response.json() as Reply;
      if (controller.signal.aborted) return;
      if (response.ok && data.ok === true && action === "request") {
        setPhase("sent"); setCode(""); setResendAt(Date.now() + 60_000); setFeedback("sent");
      } else if (response.ok && data.ok === true && data.email === normalizedEmail && action === "verify" && data.expiresIn && data.expiresIn > 0 && data.expiresIn <= 1800) {
        setPhase("verified"); setCode(""); setVerifiedUntil(Date.now() + data.expiresIn * 1000); verifiedCallback.current(normalizedEmail);
      } else {
        setPhase(action === "verify" ? "sent" : "idle");
        if (response.status === 429) {
          const wait = typeof data.resendAfter === "number" && data.resendAfter > 0 && data.resendAfter <= 60 ? data.resendAfter : 60;
          setResendAt(Date.now() + wait * 1000); setFeedback("wait");
        } else setFeedback(data.error === "invalid-email" ? "invalidEmail" : data.error === "invalid-code" ? "invalidCode" : data.error === "send-failed" ? "sendFailed" : "unavailable");
      }
    } catch { if (!controller.signal.aborted) { setPhase(action === "verify" ? "sent" : "idle"); setFeedback("unavailable"); } }
  }

  return <section className="checkout-email-verification" aria-labelledby={`${id}-heading`} aria-busy={busy}>
    <h3 id={`${id}-heading`}>{t.title}</h3>
    {phase === "verified" ? <p className="checkout-email-verified" role="status">{t.verified}: <span>{normalizedEmail}</span></p> : <>
      <p>{t.intro}</p>
      {(phase === "sent" || phase === "verifying" || resendAt > 0) && <div className="checkout-code-row"><div><label htmlFor={id}>{t.code}</label><input ref={input} id={id} name="checkout-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code}
        aria-invalid={feedback === "invalidCode"} aria-describedby={feedback ? `${id}-feedback` : undefined}
        onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); if (feedback === "invalidCode") setFeedback(null); }}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void submit("verify"); } }} /></div>
        <button className="store-btn-secondary" type="button" disabled={busy || code.length !== 6} onClick={() => void submit("verify")}>{phase === "verifying" ? t.verifying : t.verify}</button></div>}
      <button className="checkout-code-send" type="button" disabled={!eligible || busy || remaining > 0} onClick={() => void submit("request")}>{phase === "sending" ? t.sending : resendAt ? `${t.resend}${remaining ? ` (${remaining}s)` : ""}` : t.send}</button>
      {phase === "checking" && <p role="status">{t.checking}</p>}
      {feedback && <p id={`${id}-feedback`} className={feedback === "sent" || feedback === "wait" ? undefined : "checkout-error"} role={feedback === "sent" || feedback === "wait" ? "status" : "alert"}>{t[feedback]}</p>}
    </>}
  </section>;
}
