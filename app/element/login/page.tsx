import type { Metadata } from "next";
import { LoginView } from "../account";

export const metadata: Metadata = { title: "Sign in | Element | YAT.lifestyle", robots: { index: false } };

export default function Login() { return <LoginView />; }
