import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.hostname !== "admin.yatlifestyle.com") return NextResponse.next();
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/admin/") || path.startsWith("/admin") || path.startsWith("/_next/")) return NextResponse.next();
  if (path !== "/") return new Response("Not found", { status: 404 });
  const target = request.nextUrl.clone();
  target.pathname = "/admin";
  return NextResponse.rewrite(target);
}
