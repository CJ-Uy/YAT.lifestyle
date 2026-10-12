import { env } from "cloudflare:workers";
import { handleAdmin, type AdminDeps } from "../../../../lib/admin.server";
import { cancelUnpaidOrder, syncPendingOrders } from "../../../../lib/commerce.server";

const deps = (): AdminDeps => ({
  db: env.DB, limiter: env.CHECKOUT_RATE_LIMITER, username: env.ADMIN_USERNAME,
  passwordHash: env.ADMIN_PASSWORD_HASH, sessionSecret: env.ADMIN_SESSION_SECRET, now: Date.now,
  forwardTo: env.FORWARD_TO,
  syncPayments: () => syncPendingOrders(env, 5),
  getMailRaw: async (key) => { const object = await env.BUCKET.get(key); return object ? object.arrayBuffer() : null; },
  cancelOrder: (id) => cancelUnpaidOrder(env, id),
});
const action = (request: Request) => new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "";

export async function GET(request: Request) { return handleAdmin(action(request), request, deps()); }
export async function POST(request: Request) { return handleAdmin(action(request), request, deps()); }
