import type { Metadata } from "next";
import { CompareView } from "../../../account";

export const metadata: Metadata = { title: "Scent match | Element | YAT.lifestyle", robots: { index: false } };

export default async function Compare({ params }: { params: Promise<{ a: string; b: string }> }) {
  const { a, b } = await params;
  return <CompareView a={a} b={b} />;
}
