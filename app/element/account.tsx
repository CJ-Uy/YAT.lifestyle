"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import SiteHeader, { useLocale, type Locale } from "../site-header";
import { tagLabel } from "../../lib/element/copy";
import { FAMILY_NAMES } from "../../lib/element/explain";
import type { Family, Localised } from "../../lib/element/types";
import { StyledQr } from "./styled-qr";

type Profile = { shareId: string; firstName: string | null; noseType: string; noseName: Localised; likes: Record<Family, number>; tags: string[]; tagLabels?: Record<string, string>; shared: boolean };
type Match = { percent: number; shared: Family; differ: Family; sentence: string };

const copy = {
  en: {
    skip: "Skip to content", demo: "Try the demo", error: "Something went wrong. Please try again in a minute.", loading: "Loading...",
    login: { title: "Sign in to Element", intro: "No password. We email you a 6-digit code.", email: "Email", send: "Email me a code", sending: "Sending...",
      sent: "If that address can receive mail, a code is on its way. It expires in 10 minutes.", code: "6-digit code", verify: "Sign in",
      wrong: "That code did not work. Check it, or ask for a new one.", other: "Use a different email", demoNote: "The demo never needs an account." },
    me: { title: "Your scent profile", signedIn: (e: string) => `Signed in as ${e}`, none: "No profile yet. Take the demo to build one.",
      private: "Private. Only you can see it.", shared: "Shared by unlisted link. People with the link see your nose type, families and tags, never skin or pH readings.",
      share: "Share my profile", unshare: "Make private", open: "Open shared page", logout: "Sign out", needLogin: "Sign in to see your profile.", signIn: "Sign in" },
    p: { kicker: "Scent profile", title: (n: string | null) => (n ? `${n}'s elements` : "Their elements"), nose: "Nose type", families: "Families", tags: "Lifestyle tags",
      compare: "Compare with me", founder: "Compare with the founder", gift: "Gift this", try: "Try this formula", scan: "Scan to open this profile",
      privacy: "Skin and pH readings are never shown.", missing: "This profile is private or no longer shared." },
    c: { title: "Scent match", shared: "Shared", differ: "Differ most", missing: "One of these profiles is private or does not exist.", again: "Compare with someone else" },
  },
  "zh-Hant": {
    skip: "跳至內容", demo: "試玩示範", error: "出現問題，請稍後再試。", loading: "載入中…",
    login: { title: "登入 Element", intro: "毋須密碼。我們會以電郵傳送 6 位數字登入碼。", email: "電郵", send: "傳送登入碼", sending: "傳送中…",
      sent: "如果該地址可以收信，登入碼已經寄出，10 分鐘內有效。", code: "6 位數字登入碼", verify: "登入",
      wrong: "登入碼不正確或已過期，請再檢查或重新索取。", other: "改用其他電郵", demoNote: "試玩示範毋須帳戶。" },
    me: { title: "你的香氣檔案", signedIn: (e: string) => `已登入：${e}`, none: "仍未有檔案。完成試玩即可建立。",
      private: "私人檔案，只有你看得到。", shared: "以不公開連結分享。持有連結的人可看到你的嗅覺類型、香調與標籤，但永遠不會看到皮膚或 pH 數據。",
      share: "分享我的檔案", unshare: "設為私人", open: "開啟分享頁", logout: "登出", needLogin: "請先登入以查看你的檔案。", signIn: "登入" },
    p: { kicker: "香氣檔案", title: (n: string | null) => (n ? `${n} 的香氣元素` : "這位朋友的香氣元素"), nose: "嗅覺類型", families: "香調", tags: "生活標籤",
      compare: "和我比較", founder: "和創辦人比較", gift: "以此送禮", try: "試試這條配方", scan: "掃描開啟此檔案",
      privacy: "皮膚及 pH 數據永不公開。", missing: "此檔案為私人或已停止分享。" },
    c: { title: "香氣契合度", shared: "共同喜好", differ: "最大分歧", missing: "其中一個檔案為私人或不存在。", again: "和其他人比較" },
  },
  "zh-Hans": {
    skip: "跳至内容", demo: "试玩演示", error: "出现问题，请稍后再试。", loading: "加载中…",
    login: { title: "登录 Element", intro: "无需密码。我们会通过邮件发送 6 位数字登录码。", email: "邮箱", send: "发送登录码", sending: "发送中…",
      sent: "如果该地址可以收信，登录码已经发出，10 分钟内有效。", code: "6 位数字登录码", verify: "登录",
      wrong: "登录码不正确或已过期，请再检查或重新获取。", other: "改用其他邮箱", demoNote: "试玩演示无需账户。" },
    me: { title: "你的香气档案", signedIn: (e: string) => `已登录：${e}`, none: "还没有档案。完成试玩即可建立。",
      private: "私人档案，只有你能看到。", shared: "以不公开链接分享。持有链接的人可看到你的嗅觉类型、香调与标签，但永远不会看到皮肤或 pH 数据。",
      share: "分享我的档案", unshare: "设为私人", open: "打开分享页", logout: "退出登录", needLogin: "请先登录以查看你的档案。", signIn: "登录" },
    p: { kicker: "香气档案", title: (n: string | null) => (n ? `${n} 的香气元素` : "这位朋友的香气元素"), nose: "嗅觉类型", families: "香调", tags: "生活标签",
      compare: "和我比较", founder: "和创办人比较", gift: "以此送礼", try: "试试这个配方", scan: "扫描打开此档案",
      privacy: "皮肤及 pH 数据永不公开。", missing: "此档案为私人或已停止分享。" },
    c: { title: "香气契合度", shared: "共同喜好", differ: "最大分歧", missing: "其中一个档案为私人或不存在。", again: "和其他人比较" },
  },
};
type Copy = (typeof copy)["en"];

const api = (action: string, body: unknown) => fetch(`/api/element/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

function Shell({ children }: { children: (t: Copy, locale: Locale) => ReactNode }) {
  const [locale, setLocale] = useLocale();
  const t = copy[locale] as Copy;
  return <>
    <a className="skip-link" href="#element-account">{t.skip}</a>
    <SiteHeader locale={locale} onLocaleChange={setLocale} subpage />
    <main className="element-account" id="element-account">{children(t, locale)}</main>
  </>;
}

export function LoginView() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<"" | "busy" | "wrong" | "error">("");
  async function request(event: FormEvent) {
    event.preventDefault();
    setStatus("busy");
    try {
      const ok = (await api("auth-request", { email, locale: document.documentElement.lang })).ok;
      setStatus(ok ? "" : "error");
      if (ok) setStep("code");
    } catch { setStatus("error"); }
  }
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    const params = new URLSearchParams(location.search);
    setStatus("busy");
    try {
      const res = await api("auth-verify", { email, code, resultId: params.get("result") ?? undefined });
      if (!res.ok) return setStatus(res.status === 400 ? "wrong" : "error");
      const next = params.get("next") ?? "";
      location.assign(/^\/element\/[\w/-]*$/.test(next) ? next : "/element/me");
    } catch { setStatus("error"); }
  }
  return <Shell>{(t) => <section className="element-panel">
    <h1>{t.login.title}</h1>
    {step === "email" ? <form onSubmit={request}>
      <p className="element-intro">{t.login.intro}</p>
      <label htmlFor="element-email">{t.login.email}</label>
      <input id="element-email" type="email" autoComplete="email" inputMode="email" maxLength={254} required value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="element-button" type="submit" disabled={status === "busy"}>{status === "busy" ? t.login.sending : t.login.send}</button>
    </form> : <form onSubmit={verify}>
      <p className="element-intro" role="status">{t.login.sent}</p>
      <label htmlFor="element-code">{t.login.code}</label>
      <input id="element-code" name="code" autoComplete="one-time-code" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoFocus />
      <button className="element-button" type="submit" disabled={status === "busy"}>{t.login.verify}</button>
      <button className="element-link" type="button" onClick={() => { setStep("email"); setStatus(""); }}>{t.login.other}</button>
    </form>}
    <p className="element-error" role="alert">{status === "wrong" ? t.login.wrong : status === "error" ? t.error : ""}</p>
    <p className="element-muted">{t.login.demoNote} <a href="/element/demo">{t.demo}</a></p>
  </section>}</Shell>;
}

function Families({ likes, locale }: { likes: Record<Family, number>; locale: Locale }) {
  const sorted = (Object.keys(FAMILY_NAMES) as Family[]).sort((a, b) => likes[b] - likes[a]);
  return <ol className="element-families">{sorted.map((f, i) => <li key={f} className={i < 3 ? "top" : ""}>
    <span>{FAMILY_NAMES[f][locale]}</span><span className="element-bar" aria-hidden="true"><span style={{ width: `${(likes[f] / 5) * 100}%` }} /></span>
  </li>)}</ol>;
}

function ProfileBody({ p, t, locale }: { p: Profile; t: Copy; locale: Locale }) {
  return <>
    <dl className="element-facts">
      <div><dt>{t.p.nose}</dt><dd className="element-nose">{p.noseName[locale] ?? p.noseType}</dd></div>
      <div><dt>{t.p.families}</dt><dd><Families likes={p.likes} locale={locale} /></dd></div>
      {p.tags.length > 0 && <div><dt>{t.p.tags}</dt><dd><ul className="element-tags">{p.tags.map((tag) => <li key={tag}>{tagLabel(tag, locale, p.tagLabels?.[tag])}</li>)}</ul></dd></div>}
    </dl>
    <p className="element-muted">{t.p.privacy}</p>
  </>;
}

export function MeView() {
  const [data, setData] = useState<{ email: string; profile: Profile | null } | "out" | "error" | null>(null);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(location.origin);
    api("profile", {}).then(async (r) => setData(r.ok ? await r.json() : r.status === 401 ? "out" : "error")).catch(() => setData("error"));
  }, []);
  async function toggle(shared: boolean) {
    const r = await api("profile", { shared }).catch(() => null);
    if (r?.ok) setData(await r.json());
  }
  async function logout() { await api("auth-logout", {}).catch(() => null); location.assign("/element/login"); }
  return <Shell>{(t, locale) => <section className="element-panel">
    <h1>{t.me.title}</h1>
    {data === null ? <p className="element-muted">{t.loading}</p>
      : data === "out" ? <><p className="element-intro">{t.me.needLogin}</p><a className="element-button" href="/element/login">{t.me.signIn}</a></>
        : data === "error" ? <p className="element-error">{t.error}</p>
          : <>
            <p className="element-muted">{t.me.signedIn(data.email)}</p>
            {!data.profile ? <><p className="element-intro">{t.me.none}</p><a className="element-button" href="/element/demo">{t.demo}</a></> : <>
              <ProfileBody p={data.profile} t={t} locale={locale} />
              <p className="element-status">{data.profile.shared ? t.me.shared : t.me.private}</p>
              {data.profile.shared && <div className="element-qr"><StyledQr value={`${origin}/element/p/${data.profile.shareId}`} size={180} />
                <a className="element-link" href={`/element/p/${data.profile.shareId}`}>{t.me.open}</a></div>}
              <button className="element-button" type="button" onClick={() => toggle(!data.profile!.shared)}>{data.profile.shared ? t.me.unshare : t.me.share}</button>
            </>}
            <button className="element-link" type="button" onClick={logout}>{t.me.logout}</button>
          </>}
  </section>}</Shell>;
}

export function SharedView({ id }: { id: string }) {
  const [p, setP] = useState<Profile | "missing" | null>(null);
  const [mine, setMine] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(location.origin);
    fetch(`/api/element/profile?share=${encodeURIComponent(id)}`).then(async (r) => setP(r.ok ? await r.json() : "missing")).catch(() => setP("missing"));
    // Signed-in visitors compare their own profile; everyone else builds one in the demo first.
    // Only ask when the sign-in hint cookie is there, so anonymous visitors never trigger a 401.
    if (/(?:^|;\s*)yat_element_in=1(?:;|$)/.test(document.cookie))
      api("profile", {}).then(async (r) => { if (r.ok) setMine((await r.json()).profile?.shareId ?? null); }).catch(() => undefined);
  }, [id]);
  return <Shell>{(t, locale) => <section className="element-panel">
    <p className="element-kicker">{t.p.kicker}</p>
    {p === null ? <p className="element-muted">{t.loading}</p> : p === "missing" ? <>
      <h1>{t.p.missing}</h1><a className="element-button" href="/element/demo">{t.demo}</a>
    </> : <>
      <h1>{t.p.title(p.firstName)}</h1>
      <ProfileBody p={p} t={t} locale={locale} />
      <div className="element-actions">
        <a className="element-button" href={mine && mine !== id ? `/element/compare/${mine}/${id}` : "/element/demo"}>{t.p.compare}</a>
        {id !== "founder" && <a className="element-button secondary" href={`/element/compare/founder/${id}`}>{t.p.founder}</a>}
        <a className="element-button secondary" href="/shop?source=element-gift#newsletter">{t.p.gift}</a>
        <a className="element-button secondary" href="/element/demo">{t.p.try}</a>
      </div>
      <figure className="element-qr"><StyledQr value={`${origin}/element/p/${id}`} size={180} /><figcaption>{t.p.scan}</figcaption></figure>
    </>}
  </section>}</Shell>;
}

export function CompareView({ a, b }: { a: string; b: string }) {
  return <Shell>{(t, locale) => <CompareBody a={a} b={b} t={t} locale={locale} />}</Shell>;
}

function CompareBody({ a, b, t, locale }: { a: string; b: string; t: Copy; locale: Locale }) {
  const [m, setM] = useState<Match | "missing" | "error" | null>(null);
  useEffect(() => {
    setM(null);
    // A language switch re-asks; a slower answer in the old language must not land last.
    let alive = true;
    api("compare", { a, b, locale }).then(async (r) => { const next = r.ok ? await r.json() : r.status === 404 ? "missing" : "error"; if (alive) setM(next); }).catch(() => { if (alive) setM("error"); });
    return () => { alive = false; };
  }, [a, b, locale]);
  const loc = locale;
  return <section className="element-panel">
    <h1>{t.c.title}</h1>
    {m === null ? <p className="element-muted">{t.loading}</p> : m === "missing" ? <p className="element-intro">{t.c.missing}</p> : m === "error" ? <p className="element-error">{t.error}</p> : <>
      <p className="element-percent">{m.percent}%</p>
      <p className="element-intro">{m.sentence}</p>
      <dl className="element-facts compact">
        <div><dt>{t.c.shared}</dt><dd>{FAMILY_NAMES[m.shared][loc]}</dd></div>
        <div><dt>{t.c.differ}</dt><dd>{FAMILY_NAMES[m.differ][loc]}</dd></div>
      </dl>
    </>}
    <div className="element-actions">
      <a className="element-button secondary" href={`/element/p/${b}`}>{t.p.kicker}</a>
      <a className="element-button secondary" href="/shop?source=element-gift#newsletter">{t.p.gift}</a>
      <a className="element-button secondary" href="/element/demo">{t.demo}</a>
    </div>
  </section>;
}
