import type { MetadataRoute } from "next";
import { PRODUCTS } from "../lib/shop";
import { sitemapEntries } from "../lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(PRODUCTS.map(({ slug }) => slug));
}
