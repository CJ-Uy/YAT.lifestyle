import type { Metadata } from "next";
import { MeView } from "../account";

export const metadata: Metadata = { title: "Your scent profile | Element | YAT.lifestyle", robots: { index: false } };

export default function Me() { return <MeView />; }
