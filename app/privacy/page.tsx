import type { Metadata } from "next";
import PrivacyContent from "./privacy-content";

export const metadata: Metadata = { title: "Privacy policy | YAT.lifestyle", description: "How YAT.lifestyle handles newsletter signups, consent and privacy requests." };

export default function PrivacyPage() { return <PrivacyContent />; }
