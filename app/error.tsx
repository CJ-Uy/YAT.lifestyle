"use client";
import ScentError from "./scent-error";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <ScentError error reset={reset} />; }
