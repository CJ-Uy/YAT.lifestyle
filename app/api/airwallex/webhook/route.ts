import { env, waitUntil } from "cloudflare:workers";
import { handleAirwallexWebhook } from "../../../../lib/commerce.server";

export async function POST(request: Request) { return handleAirwallexWebhook(request, env, waitUntil); }
