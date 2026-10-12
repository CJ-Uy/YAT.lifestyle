import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS, productBySlug } from "../../../lib/shop";
import ProductExperience from "./product-experience";

export function generateStaticParams() { return PRODUCTS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = productBySlug((await params).slug);
  return product ? { title: `${product.name} | YAT.LIFESTYLE`, description: `${product.copy.en.subtitle}. 10 mL perfume with flower gift box, HK$228.` } : { title: "Fragrance not found | YAT.LIFESTYLE" };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = productBySlug((await params).slug);
  if (!product) notFound();
  return <ProductExperience product={product} />;
}
