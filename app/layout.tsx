import type { Metadata } from "next";
import "@fontsource/bodoni-moda/400.css";
import "@fontsource/bodoni-moda/latin-600.css";
import "./globals.css";
import "./storefront.css";

export const metadata: Metadata = {
	title: "YAT.LIFESTYLE | Twelve scents, one thoughtful gift",
	description: "Explore twelve unisex fragrances from YAT.LIFESTYLE. Each 10 mL perfume comes in a blue gift box with decorative flowers for HK$258, with free Hong Kong delivery.",
	icons: {
    icon: [{ url: "/favicon-32.png?v=3", sizes: "32x32", type: "image/png" }, { url: "/icon.svg?v=3", sizes: "any", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png?v=3",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
