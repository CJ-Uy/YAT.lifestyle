import type { Metadata } from "next";
import "@fontsource/bodoni-moda/400.css";
import "./globals.css";

export const metadata: Metadata = {
	title: "YAT.lifestyle | Perfume through time, place, and you",
	description: "A Hong Kong perfume project shaped by laboratory curiosity, time, place, and personalization.",
	icons: { icon: "/icon.svg" },
};

const directionContract = `THESIS: Hong Kong memory held inside a laboratory drop, refusing the generic luxury bottle hero.
OWN-WORLD: Carbon black projection field, warm white type, restrained liquid gold, square hairlines, film perforations, glass, and contact sheets.
STORY: Visitors meet the pipette, understand Hours, Afterimage, and Element, then learn the process, origin, and launch status.
FIRST VIEWPORT: Fixed navigation above copy and direct actions; desktop pairs text with the harbour film, while mobile leads with a portrait pipette and keeps the headline in view.
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
