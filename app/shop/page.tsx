import type { Metadata } from "next";
import ShopExperience from "./shop-experience";

export const metadata: Metadata = { title: "Fragrances | YAT.LIFESTYLE", description: "Find your scent among twelve unisex fragrances. Each 10 mL perfume includes a blue gift box with decorative flowers for HK$258, with free Hong Kong delivery." };

export default function Shop() { return <ShopExperience />; }
