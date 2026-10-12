import { env, waitUntil } from "cloudflare:workers";
import { handleCommerce } from "../../../../lib/commerce.server";

const action = (request: Request) => new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "";
export async function POST(request: Request) { return handleCommerce(action(request), request, env, waitUntil); }
export async function GET(request: Request) { return handleCommerce(action(request), request, env, waitUntil); }
