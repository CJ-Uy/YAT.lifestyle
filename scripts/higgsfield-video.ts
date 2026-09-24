import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

import {
	normalizeSeedanceInput,
	pollHiggsfieldRequest,
	submitSeedanceVideo,
	type SeedanceTextToVideoInput,
} from "../lib/seedance.server.ts";

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		duration: { type: "string" },
		resolution: { type: "string" },
		"aspect-ratio": { type: "string" },
		"no-audio": { type: "boolean", default: false },
		force: { type: "boolean", default: false },
	},
});

const prompt = positionals.join(" ").trim();
if (!prompt) {
	throw new Error(
		'Usage: npm run higgsfield:video -- "prompt" [--duration=5] [--resolution=720p] [--aspect-ratio=16:9] [--no-audio] [--force]',
	);
}

const input = normalizeSeedanceInput({
	prompt,
	duration: values.duration === undefined ? undefined : Number(values.duration),
	resolution: values.resolution as SeedanceTextToVideoInput["resolution"],
	aspect_ratio: values["aspect-ratio"] as SeedanceTextToVideoInput["aspect_ratio"],
	generate_audio: !values["no-audio"],
});
const requestDirectory = join(".higgsfield", "requests");
const requestFile = join(
	requestDirectory,
	`${createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 16)}.json`,
);

let cached;
if (!values.force) {
	try {
		cached = JSON.parse(await readFile(requestFile, "utf8"));
		if (cached.response?.status === "completed") {
			console.log(`Reusing completed request ${cached.response.request_id}.`);
			console.log(JSON.stringify(cached.response, null, 2));
			process.exit(0);
		}
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
	}
}

await mkdir(requestDirectory, { recursive: true });
const submitted = cached?.response ?? (await submitSeedanceVideo(input));
if (!cached?.response) {
	await writeFile(
		requestFile,
		JSON.stringify({ created_at: new Date().toISOString(), input, response: submitted }, null, 2),
		"utf8",
	);
	console.log(`Saved request ${submitted.request_id} before polling.`);
}

const response = await pollHiggsfieldRequest(submitted);
await writeFile(
	requestFile,
	JSON.stringify({ created_at: new Date().toISOString(), input, response }, null, 2),
	"utf8",
);
console.log(`Saved request ${response.request_id} to ${requestFile}.`);
console.log(JSON.stringify(response, null, 2));
