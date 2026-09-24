import type { Metadata } from "next";
import "@fontsource/bodoni-moda/400.css";
import "./globals.css";

export const metadata: Metadata = {
	title: "YAT.lifestyle | Perfume through time, place, and you",
	description: "A Hong Kong perfume project shaped by laboratory curiosity, time, place, and personalization.",
	icons: {
    icon: [{ url: "/favicon-32.png?v=3", sizes: "32x32", type: "image/png" }, { url: "/icon.svg?v=3", sizes: "any", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png?v=3",
  },
};

const directionContract = `THESIS: Hong Kong memory held inside a laboratory drop, refusing the generic luxury bottle hero.
OWN-WORLD: Carbon black photographic field, warm white type, restrained liquid gold, glass, and staggered editorial images.
STORY: Visitors meet the pipette, understand Hours, Afterimage, and Element, then learn the process, origin, and launch status.
FIRST VIEWPORT: Fixed navigation above copy and direct actions; full-width Hong Kong atmosphere surrounds the pipette. Mobile keeps the drop above the readable introduction. Alternating chapters lead to a vector drop in YAT.
FORM: Afterimage Hong Kong, approved Composition A, seed key 5d283ccf.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <template data-direction-contract={directionContract} />
        {children}
      </body>
    </html>
  );
}
