export type Payment = { intentId: string; clientSecret: string; mode: "prod" | "sandbox"; successUrl: string; cancelUrl: string; totalCents: number };
type SDK = { init(options: { env: "prod" | "demo"; enabledElements: string[] }): Promise<{ payments: { redirectToCheckout(options: Record<string, unknown>): Promise<void> } }> };
declare global { interface Window { AirwallexComponentsSDK?: SDK } }
let sdk: Promise<SDK> | undefined;
let initialized: ReturnType<SDK["init"]> | undefined;

export async function payWithAirwallex(payment: Payment, locale: string) {
  if (!sdk) sdk = new Promise<SDK>((resolve, reject) => {
    if (window.AirwallexComponentsSDK) { resolve(window.AirwallexComponentsSDK); return; }
    const script = document.createElement("script");
    script.src = "https://static.airwallex.com/components/sdk/v1/index.js";
    script.async = true;
    script.onload = () => window.AirwallexComponentsSDK ? resolve(window.AirwallexComponentsSDK) : reject(new Error("payment_unavailable"));
    script.onerror = () => { script.remove(); sdk = undefined; reject(new Error("payment_unavailable")); };
    document.head.append(script);
  });
  const loaded = await sdk;
  if (!initialized) initialized = loaded.init({ env: payment.mode === "prod" ? "prod" : "demo", enabledElements: ["payments"] }).catch(error => { initialized = undefined; throw error; });
  const { payments } = await initialized;
  await payments.redirectToCheckout({ intent_id: payment.intentId, client_secret: payment.clientSecret, currency: "HKD", country_code: "HK", successUrl: payment.successUrl, cancelUrl: payment.cancelUrl, locale: locale === "zh-Hant" ? "zh-HK" : locale === "zh-Hans" ? "zh" : "en", mode: "payment", autoCapture: true, appearance: { mode: "light", variables: { colorBrand: "#8a642c" } } });
}
