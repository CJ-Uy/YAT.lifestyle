import CheckoutExperience from "./checkout-experience";

export const metadata = {
  title: "Checkout · YAT.lifestyle",
  description: "Verify your email and check your Hong Kong delivery details before secure payment.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutExperience />;
}
