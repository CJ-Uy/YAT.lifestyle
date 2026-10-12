import BagExperience from "./bag-experience";

export const metadata = {
  title: "Your cart · YAT.lifestyle",
  description: "Review your fragrance cart and check out with Hong Kong delivery.",
  robots: { index: false, follow: false },
};

export default function BagPage() {
  return <BagExperience />;
}
