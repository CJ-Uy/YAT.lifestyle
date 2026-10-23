export class RequestError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } }

export async function request<T>(action: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`/api/admin/${action}`, {
    method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new RequestError(response.status, typeof data.error === "string" ? data.error : "The request could not be completed.");
  return data as T;
}

export const date = (timestamp: number) => new Intl.DateTimeFormat("en-HK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Hong_Kong" }).format(timestamp);
/** Today's Hong Kong calendar date as YYYY-MM-DD. */
export const hkToday = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
/** HK$ with cents only when present; negative amounts keep their sign. */
export const money = (cents: number) => (cents < 0 ? "−" : "") + "HK$" + (Math.abs(cents) / 100).toLocaleString("en-HK", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
/** Cents as an editable HK$ amount, e.g. 24050 → "240.50". */
export const amount = (cents: number | null) => cents === null ? "" : cents % 100 ? (cents / 100).toFixed(2) : String(cents / 100);
/** Parses "240" or "240.50" to cents; null when blank or malformed. */
export function cents(value: string) {
  const trimmed = value.trim();
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
