import type { NextConfig } from "next";

const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  // Pages read ?lang= in generateMetadata. Without this, vinext streams that metadata into a hidden <div> in <body>,
  // where search engines ignore canonical and hreflang links. Our metadata is synchronous, so blocking costs nothing.
  htmlLimitedBots: /.*/,
  async headers() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "admin.yatlifestyle.com" }], headers: noindex },
      // vinext's `:path*` needs at least one segment, so the section roots are listed too.
      ...["/admin", "/admin/:path*", "/api/:path*", "/element", "/element/:path*"].map((source) => ({ source, headers: noindex })),
    ];
  },
};

export default nextConfig;
