import type { Metadata } from "next";
import DemoFlow from "./demo-flow";
import { elementOg } from "../content";

const title = "Element demo | YAT.lifestyle";
const description = "Try Element: test your skin and nose, and watch AI tune a perfume to you.";
export const metadata: Metadata = { title, description, openGraph: elementOg(title, description) };

export default function ElementDemo() { return <DemoFlow />; }
