declare module "cloudflare:workers" {
  export const env: import("./worker-configuration").Env;
  export function waitUntil(promise: Promise<unknown>): void;
}
