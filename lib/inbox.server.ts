import PostalMime from "postal-mime";

type Statement = {
  bind(...values: (string | number)[]): Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
};
export type InboxEnv = { DB: { prepare(sql: string): Statement }; BUCKET: { put(key: string, value: Uint8Array, options: { httpMetadata: { contentType: string } }): Promise<unknown> }; FORWARD_TO: string };
export type IncomingMail = {
  from: string; to: string; raw: ReadableStream<Uint8Array>; rawSize: number;
  canBeForwarded?: boolean;
  setReject(reason: string): void;
  forward(address: string): Promise<unknown>;
};
const aliases = new Set(["orders@yatlifestyle.com", "care@yatlifestyle.com", "hello@yatlifestyle.com"]);

export async function receiveMail(message: IncomingMail, env: InboxEnv): Promise<void> {
  if (!aliases.has(message.to.toLowerCase())) { message.setReject("Unknown YAT.LIFESTYLE address."); return; }
  // Bound MIME parsing and private message storage to the same 5 MB limit.
  if (message.rawSize > 5 * 1024 * 1024) { message.setReject("Please keep messages below 5 MB or send a link to your files."); return; }
  try {
    const reader = message.raw.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 5 * 1024 * 1024) { await reader.cancel(); message.setReject("Please keep messages below 5 MB."); return; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const parsed = await PostalMime.parse(bytes);
    // Deduplicate the complete message and envelope, rather than trusting a sender's Message-ID.
    const envelope = new TextEncoder().encode(`${message.from}\n${message.to}\n`);
    const digestBytes = new Uint8Array(envelope.length + bytes.length); digestBytes.set(envelope); digestBytes.set(bytes, envelope.length);
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", digestBytes))].map(b => b.toString(16).padStart(2, "0")).join("");
    await env.BUCKET.put(`commerce-inbox/${digest}.eml`, bytes, { httpMetadata: { contentType: "message/rfc822" } });
    const now = Date.now();
    const attachments = (parsed.attachments ?? []).slice(0, 100).map(a => (a.filename || "Unnamed attachment").slice(0, 200));
    const text = parsed.text || (parsed.html ? `HTML-only message (original source):\n${parsed.html}` : "");
    const saved = await env.DB.prepare(`INSERT INTO commerce_inbox
      (id, message_id, from_email, to_email, subject, text_body, attachment_names, received_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(message_id) DO NOTHING`)
      .bind(crypto.randomUUID(), digest, message.from.slice(0, 254), message.to.slice(0, 254), (parsed.subject || "(No subject)").slice(0, 500),
        text.slice(0, 50000) + (text.length > 50000 ? "\n[Message shortened; check the forwarded original.]" : ""), JSON.stringify(attachments), now).run();
    if (!saved.success) throw new Error("storage");
    const row = await env.DB.prepare("SELECT forwarded_at FROM commerce_inbox WHERE message_id = ?").bind(digest).first<{ forwarded_at: number | null }>();
    const settings = await env.DB.prepare("SELECT forward_enabled FROM commerce_mail_settings WHERE id = 1").first<{ forward_enabled: number }>();
    if (!row || !settings) throw new Error("storage");
    if (settings.forward_enabled !== 1 || row.forwarded_at !== null) return;
    const claimed = await env.DB.prepare("UPDATE commerce_inbox SET forward_lock_until = ? WHERE message_id = ? AND forwarded_at IS NULL AND (forward_lock_until IS NULL OR forward_lock_until < ?) RETURNING id").bind(now + 60000, digest, now).first<{ id: string }>();
    if (!claimed) return;
    try {
      if (message.canBeForwarded === false) throw new Error("forward");
      await message.forward(env.FORWARD_TO);
      const forwarded = await env.DB.prepare("UPDATE commerce_inbox SET forwarded_at = ?, forward_error = 0, forward_lock_until = NULL WHERE message_id = ?").bind(now, digest).run();
      if (!forwarded.success) throw new Error("storage");
    } catch {
      await env.DB.prepare("UPDATE commerce_inbox SET forward_error = 1, forward_lock_until = NULL WHERE message_id = ?").bind(digest).run();
    }
  } catch {
    message.setReject("Your message could not be saved. Please try again later.");
  }
}
