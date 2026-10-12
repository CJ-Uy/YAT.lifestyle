import OrderExperience from "./order-experience";

export const metadata = {
  title: "Your order · YAT.lifestyle",
  description: "Your private order summary and payment status.",
  robots: { index: false, follow: false },
};

export default function OrderPage() {
  return <OrderExperience />;
}
