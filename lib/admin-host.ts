// Admin pages and API answer only on the admin host (and localhost for development).
export const ADMIN_HOST = "admin.yatlifestyle.com";

export type HostRoute = "next" | "rewrite-admin" | "not-found";

export function adminHostRoute(hostname: string, path: string): HostRoute {
  const adminPath = path.startsWith("/admin") || path.startsWith("/api/admin/");
  if (hostname === ADMIN_HOST) {
    if (adminPath || path.startsWith("/_next/")) return "next";
    return path === "/" ? "rewrite-admin" : "not-found";
  }
  if (adminPath && hostname !== "localhost" && hostname !== "127.0.0.1") return "not-found";
  return "next";
}
