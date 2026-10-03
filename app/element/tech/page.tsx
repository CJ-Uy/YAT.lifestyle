import type { Metadata } from "next";
import TechPage from "./tech-page";

const title = "Element technology | Lab notes | YAT.lifestyle";
const description = "How Element works: lid photos read on the phone, an adaptive AI survey, a nose model trained on Keller & Vosshall 2016, bounded formula tuning and perfumer review, with methods, results, limitations and references.";
export const metadata: Metadata = { title, description, openGraph: { title, description, type: "article" } };
export default function Page() { return <TechPage />; }
