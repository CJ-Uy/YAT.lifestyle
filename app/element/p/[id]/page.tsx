import type { Metadata } from "next";
import { SharedView } from "../../account";

export const metadata: Metadata = { title: "Scent profile | Element | YAT.lifestyle", robots: { index: false } };

export default async function SharedProfile({ params }: { params: Promise<{ id: string }> }) {
  return <SharedView id={(await params).id} />;
}
