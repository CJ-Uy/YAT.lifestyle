import type { Metadata } from "next";

// Element is a separate, unlinked project: keep every Element page out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ElementLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
