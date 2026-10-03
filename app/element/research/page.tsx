import type { Metadata } from "next";
import LabNotes from "../lab-notes";
export const metadata: Metadata = { title: "Element research | Lab notes | YAT.lifestyle" };
export default function ResearchPage() { return <LabNotes page="research" />; }
