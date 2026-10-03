import type { Metadata } from "next";
import ElementExperience from "./element-experience";
import { elementOg } from "./content";

const title = "Element | YAT.lifestyle";
const description = "Find your element. Smell like yourself. An exploratory at-home fragrance kit, AI tuning and perfumer review.";
export const metadata: Metadata = { title, description, openGraph: elementOg(title, description) };
export default function ElementPage() { return <ElementExperience />; }
