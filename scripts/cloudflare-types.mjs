import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const result = spawnSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "types", "worker-configuration.d.ts"], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
const path = "worker-configuration.d.ts";
const source = readFileSync(path, "utf8");
if (!source.includes("interface Env extends __BaseEnv_Env")) throw new Error("Generated Env interface missing");
// Keep generated Worker globals scoped to this module, so they cannot override browser DOM types.
writeFileSync(path, source.replace(/^interface Env extends __BaseEnv_Env/m, "export interface Env extends __BaseEnv_Env"));
