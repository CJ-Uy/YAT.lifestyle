import { receiveMail, type InboxEnv, type IncomingMail } from "../lib/inbox.server";
import { runDailyDigest, type Mailer } from "../lib/admin-notify.server";
import type { CommerceDB } from "../lib/commerce.server";

type Env = InboxEnv & { EMAIL?: { send: Mailer } };

export default {
  fetch() { return new Response("Not found", { status: 404 }); },
  email(message: IncomingMail, env: InboxEnv) { return receiveMail(message, env); },
  // Every 15 minutes; the digest itself decides whether today's saved Hong Kong time has come.
  scheduled(_controller: unknown, env: Env, context: { waitUntil(promise: Promise<unknown>): void }) {
    context.waitUntil(runDailyDigest({ db: env.DB as unknown as CommerceDB, sendEmail: env.EMAIL ? (message) => env.EMAIL!.send(message) : undefined, defaultTo: env.FORWARD_TO, now: Date.now }));
  },
};
