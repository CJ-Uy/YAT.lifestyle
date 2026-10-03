declare module "cloudflare:workers" {
  export const env: Omit<import("./lib/newsletter.server").NewsletterEnv, "DB"> & import("./lib/element/api.server").ElementEnv;
  export function waitUntil(promise: Promise<unknown>): void;
}
