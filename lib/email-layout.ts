import { SITE_URL } from "./seo.ts";
import { HK_DISTRICTS, formatPrice, productBySlug } from "./shop.ts";

export type MailLocale = "en" | "zh-Hant" | "zh-Hans";
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!));

// Mail clients drop stylesheets and web fonts, so every rule is inline and both families fall back to system fonts.
export const MAIL = {
  paper: "#eee8dd", ivory: "#f7f3eb", ink: "#292a24", muted: "#646257", gold: "#73582d", rule: "#cec6b8",
  serif: "'Bodoni Moda',Didot,'Bodoni 72',Georgia,serif",
  sans: "'Trebuchet MS','Microsoft JhengHei','PingFang TC',Arial,sans-serif",
};
const HONG_KONG = { en: "Hong Kong", "zh-Hant": "香港", "zh-Hans": "香港" };

const QUANTITY = { en: "Qty", "zh-Hant": "數量", "zh-Hans": "数量" };
const TABLE = `role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"`;

export const mailEyebrow = (text: string) => `<p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${MAIL.gold};">${escapeHtml(text)}</p>`;
export const mailHeading = (text: string) => `<h1 style="margin:0 0 16px;font-family:${MAIL.serif};font-size:30px;line-height:1.2;font-weight:400;color:${MAIL.ink};">${escapeHtml(text)}</h1>`;
export const mailLabel = (text: string) => `<p style="margin:32px 0 10px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${MAIL.muted};">${escapeHtml(text)}</p>`;
export const mailMuted = (html: string) => `<p style="margin:0;font-size:13px;line-height:1.6;color:${MAIL.muted};">${html}</p>`;

export function districtLine(id: string, locale: MailLocale) {
  const name = HK_DISTRICTS.find(([key]) => key === id)?.[locale === "en" ? 1 : locale === "zh-Hant" ? 2 : 3] ?? id;
  return locale === "en" ? `${name}, Hong Kong` : `香港${name}`;
}

/** Product rows with a thumbnail; a row shows its price only when it has a line total. */
export function mailItems(items: { slug: string; name: string; quantity: number; lineTotalCents?: number }[], locale: MailLocale) {
  const cell = `border-bottom:1px solid ${MAIL.rule};`;
  return `<table ${TABLE} style="border-top:1px solid ${MAIL.rule};">${items.map((item) => {
    const subtitle = productBySlug(item.slug)?.copy[locale].subtitle;
    // The thumbnail is the cart's gift-box-and-scent stack, pre-composited on the card colour because mail clients ignore transforms.
    return `<tr><td width="85" valign="middle" style="padding:12px 0;${cell}"><img src="${SITE_URL}/media/scents/email/${encodeURIComponent(item.slug)}.jpg" width="85" height="100" alt="${escapeHtml(item.name)}" style="display:block;border:0;"></td>
<td valign="middle" style="padding:16px;${cell}"><div style="font-family:${MAIL.serif};font-size:19px;line-height:1.25;">${escapeHtml(item.name)}</div>${subtitle ? `<div style="font-size:13px;color:${MAIL.muted};">${escapeHtml(subtitle)}</div>` : ""}<div style="font-size:13px;color:${MAIL.muted};">${QUANTITY[locale]} ${item.quantity}</div></td>
${item.lineTotalCents === undefined ? "" : `<td align="right" valign="middle" style="padding:16px 0;${cell}white-space:nowrap;">${formatPrice(item.lineTotalCents)}</td>`}</tr>`;
  }).join("")}</table>`;
}

/** Label/value rows; the last row can be set apart as a total. */
export function mailRows(rows: [string, string][], total = false) {
  return `<table ${TABLE}>${rows.map(([label, value], index) => {
    const style = total && index === rows.length - 1 ? `padding:12px 0 0;border-top:1px solid ${MAIL.rule};font-size:16px;font-weight:600;` : `padding:4px 0;color:${MAIL.muted};`;
    return `<tr><td style="${style}">${escapeHtml(label)}</td><td align="right" style="${style}white-space:nowrap;">${escapeHtml(value)}</td></tr>`;
  }).join("")}</table>`;
}

export function mailAddress(details: { name: string; district: string; phone?: string; building?: string; street?: string }, locale: MailLocale) {
  return `<p style="margin:0;">${[details.name, details.phone, details.building, details.street, districtLine(details.district, locale)].filter(Boolean).map((line) => escapeHtml(line!)).join("<br>")}</p>`;
}

export function mailLayout({ locale, preheader, body }: { locale: MailLocale; preheader: string; body: string }) {
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>YAT.LIFESTYLE</title></head>
<body style="margin:0;padding:0;background:${MAIL.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${MAIL.paper};"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${MAIL.ivory};border:1px solid ${MAIL.rule};">
<tr><td align="center" style="padding:28px 24px 22px;border-bottom:1px solid ${MAIL.rule};"><a href="${SITE_URL}" style="text-decoration:none;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-right:12px;"><img src="${SITE_URL}/media/email-emblem.png" width="23" height="36" alt="" style="display:block;border:0;"></td>
<td style="font-family:${MAIL.serif};font-size:19px;font-weight:600;letter-spacing:3px;color:${MAIL.ink};">YAT.LIFESTYLE</td>
</tr></table></a></td></tr>
<tr><td style="padding:36px 32px 32px;font-family:${MAIL.sans};font-size:15px;line-height:1.6;color:${MAIL.ink};">${body}</td></tr>
</table>
<p style="max-width:560px;margin:20px auto 0;font-family:${MAIL.sans};font-size:12px;line-height:1.6;color:${MAIL.muted};text-align:center;">YAT.LIFESTYLE · ${HONG_KONG[locale]} · <a href="${SITE_URL}" style="color:${MAIL.muted};">yatlifestyle.com</a></p>
</td></tr></table>
</body></html>`;
}
