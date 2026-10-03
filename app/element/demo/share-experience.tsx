"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import type { Locale } from "../../site-header";
import { ElementSignature } from "../element-signature";
import { callApi } from "./api";
import { renderCardPng, downloadCard } from "./card-export";
import type { Copy, Result, State } from "./demo-flow";
import {
  CARD_FAMILIES, EXAMPLE_FRIENDS, FOUNDER_VECTOR, MEMORY_KEY,
  confirmedProfileId, familyValues, parseMemories,
  type FamilyValues, type MemoryCollection, type ScentMemory,
} from "./local-social";
import { socialCopy } from "./social-copy";
import { ScentCode } from "./scent-code";
import { BASES, compare, type BaseId, type Family } from "./stubs";
import "../element-signature.css";
import "./share-experience.css";

type Props = { r: Result; s: State; t: Copy; locale: Locale; heading: RefObject<HTMLHeadingElement | null> };
type Match = { percent: number; shared: Family; differ: Family; sentence?: string; sentenceLocale?: Locale; local: boolean };
type MemorySource = { person: string; base: BaseId; likes: FamilyValues; example: boolean };

function FamilyGraph({ likes, labels, label }: { likes: FamilyValues; labels: Record<Family, string>; label: string }) {
  const cx = 210, cy = 175, radius = 101;
  const point = (index: number, scale: number) => {
    const angle = index * Math.PI / 3 - Math.PI / 2;
    return [cx + Math.cos(angle) * radius * scale, cy + Math.sin(angle) * radius * scale];
  };
  const polygon = (scales: number[]) => scales.map((scale, index) => point(index, scale).join(",")).join(" ");
  return <svg className="scent-card-graph" viewBox="0 0 420 350" role="img" aria-label={`${label}. ${CARD_FAMILIES.map(f => `${labels[f]} ${likes[f]}/5`).join(", ")}`}>
    <g aria-hidden="true">
      {[1, 2, 3, 4, 5].map(level => <polygon key={level} className="scent-graph-grid" points={polygon(CARD_FAMILIES.map(() => level / 5))} />)}
      {CARD_FAMILIES.map((family, index) => { const [x, y] = point(index, 1); return <line key={family} className="scent-graph-grid" x1={cx} y1={cy} x2={x} y2={y} />; })}
      <polygon className="scent-graph-profile" points={polygon(CARD_FAMILIES.map(family => likes[family] / 5))} />
      {CARD_FAMILIES.map((family, index) => {
        const [x, y] = point(index, likes[family] / 5);
        const [lx, ly] = point(index, 1.46);
        return <g key={family}><circle className="scent-graph-point" cx={x} cy={y} r="3" />
          <text className="scent-graph-label" x={lx} y={ly - 2} textAnchor="middle">{labels[family]}</text>
          <text className="scent-graph-value" x={lx} y={ly + 17} textAnchor="middle">{likes[family]} / 5</text></g>;
      })}
    </g>
  </svg>;
}

function FamilyBands({ likes, labels }: { likes: FamilyValues; labels: Record<Family, string> }) {
  return <ul className="social-family-bands">{CARD_FAMILIES.map(f => <li key={f}>
    <span>{labels[f]}</span><span className="social-family-track" aria-hidden="true"><i style={{ width: `${likes[f] * 20}%` }} /></span><span>{likes[f]} / 5</span>
  </li>)}</ul>;
}

export default function ShareExperience({ r, s, t, locale, heading }: Props) {
  const c = socialCopy[locale];
  const uid = useId();
  const likes = familyValues(r.nose.filled);
  const name = s.name.trim() || c.yours;
  const base = BASES[r.base].name[locale];
  const [profileLink, setProfileLink] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(Boolean(r.resultId));
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [copyField, setCopyField] = useState(false);
  const [scanHint, setScanHint] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountHeading = useRef<HTMLHeadingElement>(null);
  const memoryHeading = useRef<HTMLHeadingElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [tab, setTab] = useState<"memories" | "friends">("memories");
  const [memories, setMemories] = useState<ScentMemory[]>([]);
  const [memoryReady, setMemoryReady] = useState(false);
  const [memoryNotice, setMemoryNotice] = useState("");
  const [filter, setFilter] = useState<"all" | MemoryCollection>("all");
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [friendOpen, setFriendOpen] = useState<string | null>(null);
  const [memorySource, setMemorySource] = useState<MemorySource | null>(null);
  const [person, setPerson] = useState(name);
  const [note, setNote] = useState("");
  const [collection, setCollection] = useState<MemoryCollection>("mine");
  const [match, setMatch] = useState<Match | null>(null);
  const [comparing, setComparing] = useState(false);
  const compareEpoch = useRef(0);

  useEffect(() => {
    let alive = true;
    setProfileLink(null);
    setConfirming(Boolean(r.resultId));
    if (r.resultId) {
      callApi<{ shareId?: string; shared?: boolean }>("profile", { resultId: r.resultId, shared: true }, 5000).then(profile => {
        if (!alive) return;
        if (profile?.shared === true && confirmedProfileId(profile.shareId)) {
          setProfileLink(`${window.location.origin}/element/p/${profile.shareId}`);
        }
        setConfirming(false);
      });
    }
    return () => { alive = false; };
  }, [r.resultId]);

  useEffect(() => {
    try { setMemories(parseMemories(window.localStorage.getItem(MEMORY_KEY))); }
    catch { setMemoryNotice(c.storageError); }
    setMemoryReady(true);
    // Stored notes belong to this device, across language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (accountOpen) accountHeading.current?.focus();
  }, [accountOpen]);

  useEffect(() => {
    setMatch(null);
    setComparing(false);
    compareEpoch.current += 1;
  }, [r]);

  const qrUrl = profileLink || "https://yatlifestyle.com/element/demo";
  const qrLabel = profileLink ? c.publicQr : c.demoQr;
  const status = profileLink ? c.publicStatus : c.localStatus;
  const tags = [...new Set(s.answers.flatMap(answer => answer.tags))].filter(tag => /^[a-z0-9-]{1,32}$/.test(tag)).slice(0, 40);

  async function exportCard(nativeShare: boolean) {
    if (exporting) return;
    setExporting(true); setNotice("");
    try {
      const blob = await renderCardPng({ name, nose: r.nose.name[locale], base, concentration: r.concentration,
        families: t.families, likes, url: qrUrl, qrLabel, signatureLabel: c.signature, status, sample: c.cardSample });
      const filename = "my-element-card.png";
      const file = new File([blob], filename, { type: "image/png" });
      if (nativeShare && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }) && navigator.share) {
        try {
          await navigator.share({ files: [file], title: `${name} · Element`, text: status, ...(profileLink ? { url: profileLink } : {}) });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          downloadCard(blob, filename); setNotice(c.shareReady);
        }
      } else {
        downloadCard(blob, filename); setNotice(c.shareReady);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setNotice(c.shareError);
    } finally { setExporting(false); }
  }

  async function copyLink() {
    if (!profileLink) return;
    try { await navigator.clipboard.writeText(profileLink); setNotice(c.copied); setCopyField(false); }
    catch { setCopyField(true); setNotice(c.copyError); }
  }

  async function compareFounder() {
    if (comparing) return;
    const epoch = ++compareEpoch.current;
    setComparing(true);
    const remote = await callApi<Omit<Match, "local">>("compare", { locale, a: { likes, tags }, b: "founder" }, 6000);
    if (epoch !== compareEpoch.current) return;
    if (remote && Number.isFinite(remote.percent) && remote.percent >= 0 && remote.percent <= 100
      && CARD_FAMILIES.includes(remote.shared) && CARD_FAMILIES.includes(remote.differ)) {
      setMatch({ ...remote, sentence: typeof remote.sentence === "string" ? remote.sentence : undefined, sentenceLocale: locale, local: false });
    } else setMatch({ ...compare({ likes, tags }, FOUNDER_VECTOR), local: true });
    setComparing(false);
  }

  function store(next: ScentMemory[]) {
    try { window.localStorage.setItem(MEMORY_KEY, JSON.stringify(next)); setMemories(next); return true; }
    catch { setMemoryNotice(c.storageError); return false; }
  }

  function saveMemory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!memoryReady || !person.trim() || !note.trim()) return;
    const source = memorySource || { person: name, base: r.base, likes, example: false };
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `memory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next: ScentMemory = { id, person: person.trim(), note: note.trim(), base: source.base, likes: { ...source.likes }, collection, createdAt: new Date().toISOString(), example: source.example };
    if (store([next, ...memories].slice(0, 100))) { setSelectedMemory(id); setFilter("all"); setNote(""); setMemoryNotice(c.savedNotice); }
  }

  function rememberFriend(friend: typeof EXAMPLE_FRIENDS[number]) {
    setMemorySource({ person: friend.name, base: friend.base, likes: friend.likes, example: true });
    setPerson(`${friend.name} (${c.memoryExample})`); setCollection("people"); setNote(""); setTab("memories");
    window.requestAnimationFrame(() => { memoryHeading.current?.focus(); memoryHeading.current?.scrollIntoView({ block: "nearest", behavior: "auto" }); });
  }

  function resetMemorySource() {
    setMemorySource(null); setPerson(name); setCollection("mine"); setNote("");
    window.requestAnimationFrame(() => memoryHeading.current?.focus());
  }

  const filtered = memories.filter(memory => filter === "all" || memory.collection === filter);
  const selected = filtered.find(memory => memory.id === selectedMemory);

  return <section className="share-experience" aria-labelledby={`${uid}-title`}>
    <h1 id={`${uid}-title`} ref={heading} tabIndex={-1}>{t.share.title}</h1>
    <article className="scent-card" aria-label={c.profile}>
      <div className="scent-card-top"><ElementSignature compact /><span>{r.concentration}</span></div>
      <h2 className="scent-card-name">{name}</h2>
      <p className="scent-card-description">{base}<span aria-hidden="true"> · </span>{r.nose.name[locale]}</p>
      <FamilyGraph likes={likes} labels={t.families} label={c.preferenceScale} />
      <div className="scent-card-footer">
        <div className="scent-card-signal"><h3>{c.signature}</h3><p>{c.signatureHint}</p></div>
        <div className="scent-card-qr"><ScentCode likes={likes} value={qrUrl} /><a href={qrUrl}>{qrLabel}</a></div>
      </div>
      <p className="scent-card-caption">{c.cardSample}</p>
    </article>
    <p className="share-status" aria-live="polite">{confirming ? c.confirming : status}</p>
    <div className="share-card-actions">
      <button className="social-primary" onClick={() => exportCard(true)} disabled={exporting}>{exporting ? c.downloading : c.shareCard}</button>
      <button className="social-secondary" onClick={() => exportCard(false)} disabled={exporting}>{c.download}</button>
      {profileLink && <button className="social-text-button" onClick={copyLink}>{t.share.copy}</button>}
    </div>
    <p className="social-notice" role="status">{notice}</p>
    {copyField && profileLink && <label className="social-copy-field">{c.publicLink}<input readOnly value={profileLink} onFocus={event => event.currentTarget.select()} /></label>}

    <button className="social-account-toggle" aria-expanded={accountOpen} aria-controls={`${uid}-account`} onClick={() => setAccountOpen(value => !value)}>
      <span>{accountOpen ? c.closeAccount : c.openAccount}</span><span aria-hidden="true">{accountOpen ? "−" : "+"}</span>
    </button>
    {accountOpen && <section className="social-account" id={`${uid}-account`} aria-labelledby={`${uid}-account-heading`}>
      <header className="social-account-header"><h2 id={`${uid}-account-heading`} ref={accountHeading} tabIndex={-1}>{c.account}</h2>
        <div className="social-person"><span className="social-avatar" aria-hidden="true">{Array.from(name).slice(0, 2).join("")}</span><div><strong>{name}</strong><p>{base} · {r.concentration}</p></div><span className="social-count">{memories.length}<small>{c.saved}</small></span></div>
        <p className="social-local-label">{c.localAccount}</p><p className="social-hint">{c.localAccountHint}</p>
        {r.resultId && <a className="social-inline-link" href={`/element/login?result=${encodeURIComponent(r.resultId)}`}>{c.realAccount}<span aria-hidden="true"> ↗</span></a>}
      </header>
      <div className="social-tabs" role="tablist" aria-label={c.localAccount}>
        {(["memories", "friends"] as const).map((value, index) => <button key={value} role="tab" id={`${uid}-tab-${value}`} aria-selected={tab === value} aria-controls={`${uid}-panel-${value}`} tabIndex={tab === value ? 0 : -1} ref={el => { tabRefs.current[index] = el; }} onClick={() => setTab(value)} onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index;
          setTab(next === 0 ? "memories" : "friends"); tabRefs.current[next]?.focus();
        }}>{value === "memories" ? c.memories : c.friends}</button>)}
      </div>
      <div role="tabpanel" hidden={tab !== "memories"} id={`${uid}-panel-memories`} aria-labelledby={`${uid}-tab-memories`} className="social-memory-panel">
        <div className="social-memory-toolbar"><h3>{c.saved}</h3><select aria-label={c.collection} value={filter} onChange={event => { setFilter(event.target.value as "all" | MemoryCollection); setSelectedMemory(null); }}>
          <option value="all">{c.all}</option><option value="mine">{c.mine}</option><option value="people">{c.people}</option>
        </select></div>
        {filtered.length === 0 ? <p className="social-memory-empty">{c.empty}</p> : <ul className="social-memories">
          {filtered.map(memory => <li key={memory.id}><button className="social-memory-row" aria-expanded={selectedMemory === memory.id} aria-controls={`${uid}-memory-${memory.id}`} onClick={() => setSelectedMemory(value => value === memory.id ? null : memory.id)}>
            <span><strong>{memory.person}</strong><small>{BASES[memory.base].name[locale]}{memory.example && ` · ${c.memoryExample}`}</small></span><span>{new Date(memory.createdAt).toLocaleDateString(locale, { month: "short", day: "numeric" })}</span><span aria-hidden="true">{selectedMemory === memory.id ? "−" : "+"}</span>
          </button>{selected?.id === memory.id && <div className="social-memory-detail" id={`${uid}-memory-${memory.id}`}><p>{memory.note}</p><FamilyBands likes={memory.likes} labels={t.families} /><button className="social-text-button" onClick={() => { if (store(memories.filter(item => item.id !== memory.id))) { setSelectedMemory(null); setMemoryNotice(""); } }}>{c.remove}</button></div>}</li>)}
        </ul>}
        <form className="social-memory-form" onSubmit={saveMemory}>
          <div className="social-memory-form-heading"><h3 ref={memoryHeading} tabIndex={-1}>{c.saveMemory}</h3>{memorySource && <button type="button" className="social-text-button" onClick={resetMemorySource}>{c.yours}</button>}</div>
          <p className="social-hint">{memorySource ? `${c.rememberExample} ${BASES[memorySource.base].name[locale]}` : `${base} · ${r.concentration}`}</p>
          <label htmlFor={`${uid}-person`}>{c.person}<input id={`${uid}-person`} value={person} onChange={event => setPerson(event.target.value)} maxLength={80} required autoComplete="off" /></label>
          <label htmlFor={`${uid}-note`}>{c.note}<textarea id={`${uid}-note`} value={note} onChange={event => setNote(event.target.value)} placeholder={c.notePlaceholder} maxLength={500} rows={3} required /></label>
          <div className="social-memory-save"><label htmlFor={`${uid}-collection`}>{c.collection}<select id={`${uid}-collection`} value={collection} onChange={event => setCollection(event.target.value as MemoryCollection)}><option value="mine">{c.mine}</option><option value="people">{c.people}</option></select></label><button type="submit" className="social-primary" disabled={!memoryReady || !person.trim() || !note.trim()}>{c.save}</button></div>
          <p className="social-notice" role="status">{memoryNotice}</p>
        </form>
      </div><div role="tabpanel" hidden={tab !== "friends"} id={`${uid}-panel-friends`} aria-labelledby={`${uid}-tab-friends`} className="social-friends-panel">
        <h3>{c.exampleFriends}</h3><p className="social-hint">{c.examplesHint}</p>
        <ul className="social-friends">{EXAMPLE_FRIENDS.map(friend => {
          const similarity = compare({ likes, tags: [] }, { likes: friend.likes, tags: [] });
          return <li key={friend.id}><button className="social-friend-row" aria-expanded={friendOpen === friend.id} aria-controls={`${uid}-friend-${friend.id}`} onClick={() => setFriendOpen(value => value === friend.id ? null : friend.id)}>
            <span className="social-avatar" aria-hidden="true">{friend.name[0]}</span><span><strong>{friend.name}</strong><small>{BASES[friend.base].name[locale]}</small></span><span aria-hidden="true">{friendOpen === friend.id ? "−" : "+"}</span>
          </button>{friendOpen === friend.id && <div className="social-friend-detail" id={`${uid}-friend-${friend.id}`}><p><strong>{similarity.percent}%</strong> {c.similarity}</p><FamilyBands likes={friend.likes} labels={t.families} /><button className="social-secondary" onClick={() => rememberFriend(friend)}>{c.remember}</button></div>}</li>;
        })}</ul>
        <div className="social-planned"><h3>{c.plannedOrder}</h3><p>{c.plannedHint}</p><a className="social-inline-link" href="/shop?source=element-order#newsletter">{c.waitlist}<span aria-hidden="true"> ↗</span></a></div>
      </div>
    </section>}

    <div className="social-founder"><button className="social-secondary" onClick={compareFounder} disabled={comparing}>{comparing ? c.compareLoading : t.share.compareFounder}</button>
      <p className="social-hint">{c.founderHint}</p>
      {match && <div className="social-match" role="status"><p><strong>{match.percent}%</strong><span>{t.share.compareResult}</span></p><p>{match.sentence && match.sentenceLocale === locale ? match.sentence : t.share.compareLine(t.families[match.shared], t.families[match.differ])}</p>{match.local && <p className="social-hint">{c.localCompare}</p>}</div>}
    </div>
    <button className="social-text-button social-scan" onClick={() => setScanHint(value => !value)} aria-expanded={scanHint} aria-controls={`${uid}-scan`}>{c.scan}</button>
    {scanHint && <p className="social-hint social-scan-hint" id={`${uid}-scan`}>{c.scanHint}</p>}
  </section>;
}
