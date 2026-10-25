import type { Metadata } from "next";
import ShopExperience from "./shop-experience";
import { PAGE_COPY, localeFromParam, storeMetadata } from "../../lib/seo";

type Props = { searchParams: Promise<{ lang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const locale = localeFromParam((await searchParams).lang);
  return storeMetadata("/shop", locale, PAGE_COPY.shop[locale]);
}

export default async function Shop({ searchParams }: Props) { return <ShopExperience initialLocale={localeFromParam((await searchParams).lang)} />; }
