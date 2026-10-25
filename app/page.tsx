import type { Metadata } from "next";
import { StoreHome } from "./storefront";
import { PAGE_COPY, jsonLd, localeFromParam, organizationJsonLd, storeMetadata } from "../lib/seo";

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const locale = localeFromParam((await searchParams).lang);
  return storeMetadata("/", locale, PAGE_COPY.home[locale]);
}

export default async function Home({ searchParams }: Props) {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationJsonLd()) }} />
    <StoreHome initialLocale={localeFromParam((await searchParams).lang)} />
  </>;
}
