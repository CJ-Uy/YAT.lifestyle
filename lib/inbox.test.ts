import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { receiveMail, type InboxEnv, type IncomingMail } from "./inbox.server.ts";

const DESTINATION = "A66454385@gmail.com";
const encode = (value: string) => new TextEncoder().encode(value.replaceAll("\n", "\r\n"));
const plain = (subject = "A question", body = "Hello Natasha.", messageId = "<message@example.com>") => encode([
  "From: Customer <sender@example.com>", "To: care@yatlifestyle.com", `Subject: ${subject}`, `Message-ID: ${messageId}`,
  "MIME-Version: 1.0", "Content-Type: text/plain; charset=utf-8", "", body,
].join("\n"));

function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../migrations/0009_inbox.sql", import.meta.url), "utf8"));
  const prepare: InboxEnv["DB"]["prepare"] = (sql) => {
    let values: (string | number)[] = [];
    const statement: ReturnType<InboxEnv["DB"]["prepare"]> = {
      bind: (...bound) => { values = bound; return statement; },
      first: async () => (db.prepare(sql).get(...values) ?? null) as never,
      run: async () => { db.prepare(sql).run(...values); return { success: true }; },
    };
    return statement;
  };
  const archived: { key: string; bytes: Uint8Array; contentType: string }[] = [];
  const env: InboxEnv = { DB: { prepare }, BUCKET: { put: async (key, bytes, options) => { archived.push({ key, bytes: bytes.slice(), contentType: options.httpMetadata.contentType }); } }, FORWARD_TO: DESTINATION };
  const rejected: string[] = [], forwarded: string[] = [];
  function mail(bytes = plain(), extra: Partial<IncomingMail> = {}): IncomingMail {
    return {
      from: "sender@example.com", to: "care@yatlifestyle.com", rawSize: bytes.length,
      raw: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }),
      setReject: (reason) => { rejected.push(reason); },
      forward: async (address) => { forwarded.push(address); }, ...extra,
    };
  }
  return { db, env, mail, rejected, forwarded, archived };
}

test("inbox: incoming mail is stored and forwarded to the configured default with millisecond timestamps", async () => {
  const { db, env, mail, rejected, forwarded } = setup(), before = Date.now();
  await receiveMail(mail(), env);
  const row = db.prepare("SELECT * FROM commerce_inbox").get()!;
  assert.equal(row.from_email, "sender@example.com"); assert.equal(row.to_email, "care@yatlifestyle.com");
  assert.equal(row.subject, "A question"); assert.match(String(row.text_body), /Hello Natasha/);
  assert.ok(Number(row.received_at) >= before && Number(row.received_at) <= Date.now(), "the admin formatter expects epoch milliseconds");
  assert.ok(Number(row.forwarded_at) >= before); assert.equal(row.forward_error, 0);
  assert.deepEqual(forwarded, [DESTINATION]); assert.deepEqual(rejected, []);
});

test("inbox: forwarding is optional, while the complete original remains privately archived", async () => {
  const { db, env, mail, rejected, forwarded, archived } = setup();
  db.prepare("UPDATE commerce_mail_settings SET forward_enabled = 0 WHERE id = 1").run();
  await receiveMail(mail(), env);
  const row = db.prepare("SELECT forwarded_at, forward_error FROM commerce_inbox").get()!;
  assert.equal(row.forwarded_at, null); assert.equal(row.forward_error, 0);
  assert.deepEqual(forwarded, []); assert.deepEqual(rejected, []);
  assert.equal(archived.length, 1); assert.match(archived[0].key, /^commerce-inbox\/[a-f0-9]{64}\.eml$/);
  assert.equal(archived[0].contentType, "message/rfc822"); assert.deepEqual(archived[0].bytes, plain());
});

test("inbox: a failed private archive rejects before committing or forwarding the message", async () => {
  const { db, env, mail, rejected, forwarded } = setup();
  await receiveMail(mail(), { ...env, BUCKET: { put: async () => { throw new Error("archive unavailable"); } } });
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM commerce_inbox").get()!.n, 0);
  assert.equal(rejected.length, 1); assert.deepEqual(forwarded, []);
});

test("inbox: failed initial storage rejects rather than accepting or forwarding an unrecorded email", async () => {
  for (const throws of [true, false]) {
    const { db, env, mail, rejected, forwarded } = setup();
    const broken: InboxEnv = { ...env, DB: { prepare: (sql) => {
      if (!sql.startsWith("INSERT INTO commerce_inbox")) return env.DB.prepare(sql);
      const statement: ReturnType<InboxEnv["DB"]["prepare"]> = {
        bind: () => statement, first: async () => null,
        run: async () => { if (throws) throw new Error("database unavailable"); return { success: false }; },
      };
      return statement;
    } } };
    await receiveMail(mail(), broken);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM commerce_inbox").get()!.n, 0);
    assert.equal(rejected.length, 1); assert.match(rejected[0], /could not be saved/); assert.deepEqual(forwarded, []);
  }
});

test("inbox: unknown aliases and declared oversized messages are rejected", async () => {
  const { db, env, mail, rejected, forwarded } = setup();
  await receiveMail(mail(plain(), { to: "unknown@yatlifestyle.com" }), env);
  await receiveMail(mail(plain(), { rawSize: 5 * 1024 * 1024 + 1 }), env);
  assert.equal(rejected.length, 2); assert.match(rejected[0], /Unknown/); assert.match(rejected[1], /below 5 MB/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM commerce_inbox").get()!.n, 0); assert.deepEqual(forwarded, []);
});

test("inbox: actual stream bytes are bounded even when rawSize underreports; oversize reading is cancelled", async () => {
  const { db, env, mail, rejected, forwarded } = setup(); let cancelled = false;
  const raw = new ReadableStream<Uint8Array>({
    start(controller) { for (let index = 0; index < 21; index++) controller.enqueue(new Uint8Array(256 * 1024)); },
    cancel() { cancelled = true; },
  });
  await receiveMail(mail(plain(), { raw, rawSize: 1 }), env);
  assert.equal(cancelled, true); assert.equal(rejected.length, 1); assert.match(rejected[0], /below 5 MB/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM commerce_inbox").get()!.n, 0); assert.deepEqual(forwarded, []);
});

test("inbox: the full bytes plus envelope deduplicate retries without trusting sender Message-ID", async () => {
  const { db, env, mail, rejected, forwarded } = setup(), bytes = plain();
  await receiveMail(mail(bytes), env); await receiveMail(mail(bytes), env);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM commerce_inbox").get()!.n, 1); assert.equal(forwarded.length, 1);
  await receiveMail(mail(plain("A different question")), env);
  await receiveMail(mail(bytes, { to: "orders@yatlifestyle.com" }), env);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM commerce_inbox").get()!.n, 3); assert.equal(forwarded.length, 3);
  assert.deepEqual(rejected, []);
});

test("inbox: a forwarding failure leaves the message stored and flags the failure; a later retry can clear it", async () => {
  const { db, env, mail, rejected, forwarded } = setup(), bytes = plain();
  await receiveMail(mail(bytes, { forward: async () => { throw new Error("destination is unverified"); } }), env);
  const first = db.prepare("SELECT id, forwarded_at, forward_error FROM commerce_inbox").get()!;
  assert.equal(first.forwarded_at, null); assert.equal(first.forward_error, 1); assert.deepEqual(rejected, []);
  await receiveMail(mail(bytes), env);
  const second = db.prepare("SELECT id, forwarded_at, forward_error FROM commerce_inbox").get()!;
  assert.equal(second.id, first.id); assert.notEqual(second.forwarded_at, null); assert.equal(second.forward_error, 0);
  await receiveMail(mail(bytes), env); assert.equal(forwarded.length, 1);
});

test("inbox: messages forbidden from forwarding are retained without calling the forwarding service", async () => {
  const { db, env, mail, rejected, forwarded } = setup();
  await receiveMail(mail(plain(), { canBeForwarded: false }), env);
  const row = db.prepare("SELECT forwarded_at, forward_error FROM commerce_inbox").get()!;
  assert.equal(row.forwarded_at, null); assert.equal(row.forward_error, 1);
  assert.deepEqual(forwarded, []); assert.deepEqual(rejected, []);
});

test("inbox: HTML-only source stays plain text; multipart attachment names and complete original are retained", async () => {
  const { db, env, mail } = setup();
  const html = encode("From: sender@example.com\nTo: care@yatlifestyle.com\nSubject: HTML only\nMIME-Version: 1.0\nContent-Type: text/html; charset=utf-8\n\n<script>never render this</script><p>Hello</p>");
  await receiveMail(mail(html), env);
  const htmlRow = db.prepare("SELECT text_body FROM commerce_inbox WHERE subject = 'HTML only'").get()!;
  assert.match(String(htmlRow.text_body), /HTML-only message \(original source\)/); assert.ok(String(htmlRow.text_body).includes("<script>"));
  const multipart = encode([
    "From: sender@example.com", "To: care@yatlifestyle.com", "Subject: With attachment", "MIME-Version: 1.0", "Content-Type: multipart/mixed; boundary=sample", "",
    "--sample", "Content-Type: text/plain; charset=utf-8", "", "The invoice is attached.",
    "--sample", "Content-Type: application/pdf; name=invoice.pdf", "Content-Disposition: attachment; filename=invoice.pdf", "Content-Transfer-Encoding: base64", "", "JVBERi0xLjQK", "--sample--", "",
  ].join("\n"));
  await receiveMail(mail(multipart), env);
  const row = db.prepare("SELECT text_body, attachment_names FROM commerce_inbox WHERE subject = 'With attachment'").get()!;
  assert.match(String(row.text_body), /invoice is attached/); assert.deepEqual(JSON.parse(String(row.attachment_names)), ["invoice.pdf"]);
  assert.ok(!String(row.text_body).includes("JVBERi0"));
});

test("inbox: long message text is explicitly shortened and the saved subject is bounded", async () => {
  const { db, env, mail } = setup();
  await receiveMail(mail(plain("s".repeat(900), "x".repeat(51000))), env);
  const row = db.prepare("SELECT subject, text_body FROM commerce_inbox").get()!;
  assert.equal(String(row.subject).length, 500); assert.match(String(row.text_body), /Message shortened; check the forwarded original/);
  assert.ok(String(row.text_body).length < 50100);
});

test("inbox: concurrent deliveries of one message do not send two forwarded copies", async () => {
  const { db, env, mail } = setup(), bytes = plain(); let count = 0;
  let release!: () => void, entered!: () => void, secondEntered!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const firstForward = new Promise<void>((resolve) => { entered = resolve; });
  const secondForward = new Promise<void>((resolve) => { secondEntered = resolve; });
  const forward = async () => { count++; if (count === 1) entered(); else secondEntered(); await gate; };
  const first = receiveMail(mail(bytes, { forward }), env);
  await firstForward;
  const second = receiveMail(mail(bytes, { forward }), env);
  await Promise.race([second, secondForward]);
  release(); await Promise.all([first, second]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM commerce_inbox").get()!.n, 1);
  assert.equal(count, 1, "one atomic forwarding claim must win");
});
