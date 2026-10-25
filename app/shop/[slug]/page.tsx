import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS, productBySlug } from "../../../lib/shop";
import { jsonLd, localeFromParam, productCopy, productJsonLd, storeMetadata } from "../../../lib/seo";
import ProductExperience from "./product-experience";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string | string[] }> };

export function generateStaticParams() { return PRODUCTS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const product = productBySlug((await params).slug);
  if (!product) return { title: "Fragrance not found | YAT.LIFESTYLE" };
  const locale = localeFromParam((await searchParams).lang);
  return storeMetadata(`/shop/${product.slug}`, locale, productCopy(product, locale));
}
export default async function ProductPage({ params, searchParams }: Props) {
  const product = productBySlug((await params).slug);
  if (!product) notFound();
  const locale = localeFromParam((await searchParams).lang);
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd(product, locale)) }} />
    <ProductExperience product={product} initialLocale={locale} />
  </>;
}
