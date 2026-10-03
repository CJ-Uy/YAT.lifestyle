import type { Metadata } from "next";
import ScentError from "./scent-error";

export const metadata: Metadata = { title: "Not found | YAT.lifestyle" };
export default function NotFound() { return <ScentError />; }
