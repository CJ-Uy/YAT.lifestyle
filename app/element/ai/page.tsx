import type { Metadata } from "next";
import LabNotes from "../lab-notes";
export const metadata: Metadata = { title: "Element AI | Lab notes | YAT.lifestyle" };
export default function AiPage() { return <LabNotes page="ai" />; }
