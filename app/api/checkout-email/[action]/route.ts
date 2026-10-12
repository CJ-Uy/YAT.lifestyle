import { env } from "cloudflare:workers";
import { handleCheckoutEmail } from "../../../../lib/checkout-email.server";

const action = (request: Request) => new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "";
export async function POST(request: Request) { return handleCheckoutEmail(action(request), request, env); }
export async function GET(request: Request) { return handleCheckoutEmail(action(request), request, env); }
