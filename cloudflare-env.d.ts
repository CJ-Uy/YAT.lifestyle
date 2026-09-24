declare module "cloudflare:workers" {
  export const env: import("./lib/newsletter.server").NewsletterEnv;
}
