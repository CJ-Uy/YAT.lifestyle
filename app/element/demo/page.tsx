import type { Metadata } from "next";
import DemoFlow from "./demo-flow";

export const metadata: Metadata = { title: "Element demo | YAT.lifestyle", description: "Try Element: test your skin and nose, and watch AI tune a perfume to you." };

export default function ElementDemo() { return <DemoFlow />; }
