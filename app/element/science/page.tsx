import type { Metadata } from "next";
import LabNotes from "../lab-notes";
export const metadata: Metadata = { title: "Element science | Lab notes | YAT.lifestyle" };
export default function SciencePage() { return <LabNotes page="science" />; }
