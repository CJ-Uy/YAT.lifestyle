import { env } from "cloudflare:workers";
import { subscribe } from "../../../lib/newsletter.server";

export async function POST(request: Request) {
  return subscribe(request, env);
}
