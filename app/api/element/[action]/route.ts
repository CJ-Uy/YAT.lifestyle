import { env, waitUntil } from "cloudflare:workers";
import { handle, type Deps } from "../../../../lib/element/api.server";
import { inferNose } from "../../../../lib/element/nose";

const deps = (): Deps => ({
  ai: env.AI, db: env.DB, bucket: env.BUCKET, vectorize: env.TAGS, limiter: env.ELEMENT_RATE_LIMITER,
  adminKey: env.ELEMENT_ADMIN_KEY, now: Date.now, inferNose, waitUntil,
});
const action = (request: Request) => new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "";

export async function POST(request: Request) {
  return handle(action(request), request, deps());
}

// Only `label` (the share card image) answers GET; every other action returns 405.
export async function GET(request: Request) {
  return handle(action(request), request, deps());
}
