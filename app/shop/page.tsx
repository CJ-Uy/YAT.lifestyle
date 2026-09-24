import type { Metadata } from "next";
import ShopExperience from "./shop-experience";

export const metadata: Metadata = { title: "Shop | YAT.lifestyle", description: "Our first fragrances are in development. Discover what's taking shape at YAT.lifestyle." };

export default function Shop() { return <ShopExperience />; }
