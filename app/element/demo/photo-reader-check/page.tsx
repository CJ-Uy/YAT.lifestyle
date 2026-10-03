import { notFound } from "next/navigation";
import PhotoReaderCheck from "./check";

// Dev-only page: a real 404 in production.
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PhotoReaderCheck />;
}
