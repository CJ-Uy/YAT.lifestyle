import { NextResponse, type NextRequest } from "next/server";
import { adminHostRoute } from "./lib/admin-host";

export function middleware(request: NextRequest) {
  const route = adminHostRoute(request.nextUrl.hostname, request.nextUrl.pathname);
  if (route === "not-found") return new Response("Not found", { status: 404 });
  if (route === "next") return NextResponse.next();
  const target = request.nextUrl.clone();
  target.pathname = "/admin";
  return NextResponse.rewrite(target);
}
