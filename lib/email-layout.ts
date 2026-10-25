import { SITE_URL } from "./seo.ts";
import { HK_DISTRICTS, formatPrice, productBySlug } from "./shop.ts";

export type MailLocale = "en" | "zh-Hant" | "zh-Hans";
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!));

// Mail clients drop stylesheets and web fonts, so every rule is inline and both families fall back to system fonts.
// The palette is the homepage's dark one: Gmail's apps flip light emails in dark mode, but a locked dark email stays put.
export const MAIL = {
  page: "#080806", card: "#141411", raised: "#1f1f1a", rule: "#34332c", text: "#f1eadc", muted: "#aaa499", gold: "#d8a443",
  serif: "'Bodoni Moda',Didot,'Bodoni 72',Georgia,serif",
  sans: "'Trebuchet MS','Microsoft JhengHei','PingFang TC',Arial,sans-serif",
};
const HONG_KONG = { en: "Hong Kong", "zh-Hant": "香港", "zh-Hans": "香港" };
const QUANTITY = { en: "Qty", "zh-Hant": "數量", "zh-Hans": "数量" };
const TABLE = `role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"`;
const SMALL_CAPS = `font-size:12px;line-height:18px;letter-spacing:2px;text-transform:uppercase;color:${MAIL.muted};`;

/** Gmail recolours plain backgrounds and borders but never background images, so every fill is also a one-colour gradient. */
export const fill = (color: string) => `background-color:${color};background-image:linear-gradient(${color},${color});`;
/**
 * Gmail's dark mode inverts text; inside these wrappers a difference blend inverts it back and a screen blend drops the black
 * (the `u + .body` styles only match in Gmail). It restores light, low-saturation text only, so gold lives in fills and images
 * stay outside the wrappers. https://www.hteumeuleu.com/2021/fixing-gmail-dark-mode-css-blend-modes/
 */
export const lock = (html: string) => `<div class="gb-s"><div class="gb-d">${html}</div></div>`;
export const mailText = (html: string, style = "") => lock(`<div style="font-family:${MAIL.sans};font-size:15px;line-height:24px;color:${MAIL.text};${style}">${html}</div>`);
export const mailSpace = (px: number) => `<div style="height:${px}px;line-height:${px}px;font-size:1px;">&nbsp;</div>`;
export const mailRule = () => `<div style="height:1px;line-height:1px;font-size:1px;${fill(MAIL.rule)}">&nbsp;</div>`;

export const mailEyebrow = (text: string) => `<div style="width:28px;height:2px;line-height:2px;font-size:1px;${fill(MAIL.gold)}">&nbsp;</div>${mailSpace(12)}${mailText(escapeHtml(text), SMALL_CAPS)}${mailSpace(10)}`;
export const mailHeading = (text: string) => `${mailText(escapeHtml(text), `font-family:${MAIL.serif};font-size:30px;line-height:36px;`)}${mailSpace(16)}`;
export const mailLabel = (text: string) => `${mailSpace(32)}${mailText(escapeHtml(text), SMALL_CAPS)}${mailSpace(10)}`;
export const mailMuted = (html: string) => mailText(html, `font-size:13px;line-height:20px;color:${MAIL.muted};`);
export const mailLink = (href: string, label: string) => `<a href="${href}" style="color:${MAIL.text};text-decoration:underline;">${label}</a>`;

export function districtLine(id: string, locale: MailLocale) {
  const name = HK_DISTRICTS.find(([key]) => key === id)?.[locale === "en" ? 1 : locale === "zh-Hant" ? 2 : 3] ?? id;
  return locale === "en" ? `${name}, Hong Kong` : `香港${name}`;
}

/** Product rows with a thumbnail; a row shows its price only when it has a line total. */
export function mailItems(items: { slug: string; name: string; quantity: number; lineTotalCents?: number }[], locale: MailLocale) {
  return `${mailRule()}<table ${TABLE}>${items.map((item, index) => {
    const subtitle = productBySlug(item.slug)?.copy[locale].subtitle;
    const muted = `font-size:13px;line-height:20px;color:${MAIL.muted};`;
    // The thumbnail is the cart's gift-box-and-scent stack, pre-composited on the card colour because mail clients ignore transforms.
    return `${index ? `<tr><td colspan="3">${mailRule()}</td></tr>` : ""}<tr><td width="85" valign="middle" style="padding:12px 0;"><img src="${SITE_URL}/media/scents/email/${encodeURIComponent(item.slug)}-dark.jpg" width="85" height="100" alt="${escapeHtml(item.name)}" style="display:block;border:0;"></td>
<td valign="middle" style="padding:12px 16px;">${mailText(escapeHtml(item.name), `font-family:${MAIL.serif};font-size:19px;line-height:24px;`)}${subtitle ? mailText(escapeHtml(subtitle), muted) : ""}${mailText(`${QUANTITY[locale]} ${item.quantity}`, muted)}</td>
${item.lineTotalCents === undefined ? "" : `<td align="right" valign="middle" style="padding:12px 0;">${mailText(formatPrice(item.lineTotalCents), "white-space:nowrap;text-align:right;")}</td>`}</tr>`;
  }).join("")}</table>${mailRule()}`;
}

/** Label/value rows; the last row can be set apart as a total. */
export function mailRows(rows: [string, string][], total = false) {
  return `<table ${TABLE}>${rows.map(([label, value], index) => {
    const last = total && index === rows.length - 1, style = last ? "font-size:16px;line-height:24px;font-weight:600;" : `color:${MAIL.muted};`;
    return `${last ? `<tr><td colspan="2" style="padding:8px 0 12px;">${mailRule()}</td></tr>` : ""}<tr><td style="padding:3px 0;">${mailText(escapeHtml(label), style)}</td><td align="right" style="padding:3px 0;">${mailText(escapeHtml(value), `${style}white-space:nowrap;text-align:right;`)}</td></tr>`;
  }).join("")}</table>`;
}

export function mailAddress(details: { name: string; district: string; phone?: string; building?: string; street?: string }, locale: MailLocale) {
  return mailText([details.name, details.phone, details.building, details.street, districtLine(details.district, locale)].filter(Boolean).map((line) => escapeHtml(line!)).join("<br>"));
}

/** A raised panel; its contents still need `mailText` for their words. */
export const mailPanel = (cells: string[], padding = "18px 20px") => `<table ${TABLE} style="${fill(MAIL.raised)}"><tr>${cells.map((cell) => `<td valign="top" style="padding:${padding};">${cell}</td>`).join("")}</tr></table>`;

export function mailLayout({ locale, preheader, body }: { locale: MailLocale; preheader: string; body: string }) {
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>YAT.LIFESTYLE</title>
<style>u + .body .gb-s { background:#000; mix-blend-mode:screen; } u + .body .gb-d { background:#000; mix-blend-mode:difference; }</style></head>
<body class="body" style="margin:0;padding:0;${fill(MAIL.page)}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table ${TABLE} style="${fill(MAIL.page)}"><tr><td align="center" style="padding:32px 12px;">
<table ${TABLE} style="max-width:560px;${fill(MAIL.card)}">
<tr><td align="center" style="padding:28px 24px 24px;"><a href="${SITE_URL}" style="text-decoration:none;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-right:12px;"><img src="${SITE_URL}/media/email-emblem-dark.png" width="23" height="36" alt="" style="display:block;border:0;"></td>
<td>${mailText("YAT.LIFESTYLE", `font-family:${MAIL.serif};font-size:19px;font-weight:600;letter-spacing:3px;line-height:24px;`)}</td>
</tr></table></a></td></tr>
<tr><td style="padding:0 32px;">${mailRule()}</td></tr>
<tr><td style="padding:36px 32px 32px;">${body}</td></tr>
</table>
${mailSpace(20)}<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">${mailText(`YAT.LIFESTYLE · ${HONG_KONG[locale]} · ${mailLink(SITE_URL, "yatlifestyle.com")}`, `font-size:12px;line-height:18px;color:${MAIL.muted};text-align:center;`)}</td></tr></table>
</td></tr></table>
</body></html>`;
}
