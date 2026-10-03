import type { Metadata } from "next";
import { SharedView } from "../../account";
import { elementOg } from "../../content";

const title = "Scent profile | Element | YAT.lifestyle";
const description = "A shared Element scent profile: nose type, favourite scent families and lifestyle tags. Never skin or pH readings.";
export const metadata: Metadata = { title, description, robots: { index: false }, openGraph: elementOg(title, description) };

export default async function SharedProfile({ params }: { params: Promise<{ id: string }> }) {
  return <SharedView id={(await params).id} />;
}
