const MODEL_ID = "bytedance/seedance-2.0/text-to-video";
const ENDPOINT = `https://api.higgsfield.ai/${MODEL_ID}`;
const RESOLUTIONS = ["480p", "720p", "1080p", "4k"] as const;
const ASPECT_RATIOS = ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"] as const;
const TERMINAL_STATUSES = new Set(["completed", "failed", "nsfw", "canceled"]);

export interface SeedanceTextToVideoInput {
	prompt: string;
	duration?: number;
	resolution?: (typeof RESOLUTIONS)[number];
	aspect_ratio?: (typeof ASPECT_RATIOS)[number];
	generate_audio?: boolean;
}

export interface HiggsfieldResponse {
	status: "queued" | "in_progress" | "completed" | "failed" | "nsfw" | "canceled";
	request_id: string;
	status_url: string;
	cancel_url: string;
	images?: Array<{ url: string }>;
	video?: { url: string };
}

interface RequestOptions {
	credentials?: string;
	fetchImpl?: typeof fetch;
}

interface PollOptions extends RequestOptions {
	timeoutMs?: number;
	initialDelayMs?: number;
	maxDelayMs?: number;
}

export function normalizeSeedanceInput(input: SeedanceTextToVideoInput) {
	if (!input.prompt.trim()) {
		throw new Error("Seedance requires a non-empty prompt.");
	}
	if (
		input.duration !== undefined &&
		(!Number.isInteger(input.duration) || input.duration < 4 || input.duration > 15)
	) {
		throw new Error("Seedance duration must be an integer from 4 to 15 seconds.");
	}
	if (input.resolution && !RESOLUTIONS.includes(input.resolution)) {
		throw new Error(`Seedance resolution must be one of: ${RESOLUTIONS.join(", ")}.`);
	}
	if (input.aspect_ratio && !ASPECT_RATIOS.includes(input.aspect_ratio)) {
		throw new Error(`Seedance aspect ratio must be one of: ${ASPECT_RATIOS.join(", ")}.`);
	}

	return {
		prompt: input.prompt.trim(),
		duration: input.duration ?? 5,
		resolution: input.resolution ?? "720p",
		aspect_ratio: input.aspect_ratio ?? "16:9",
		generate_audio: input.generate_audio ?? true,
	};
}

function authorization(credentials = process.env.HF_CREDENTIALS) {
	const separator = credentials?.indexOf(":") ?? -1;
	if (
		!credentials ||
		credentials === "your-key-id:your-key-secret" ||
		separator < 1 ||
		separator === credentials.length - 1
	) {
		throw new Error("HF_CREDENTIALS must be configured as key-id:key-secret.");
	}
	return `Key ${credentials}`;
}

async function parseResponse(response: Response) {
	const body = (await response.json().catch(() => null)) as
		| (Partial<HiggsfieldResponse> & { detail?: string; message?: string })
		| null;
	if (!response.ok) {
		const correlation = response.headers.get("x-correlation-id");
		const detail = body?.detail ?? body?.message ?? response.statusText;
		throw new Error(
			`Higgsfield request failed (${response.status}): ${detail}${correlation ? ` [${correlation}]` : ""}`,
		);
	}
	return body as HiggsfieldResponse;
}

export async function submitSeedanceVideo(
	input: SeedanceTextToVideoInput,
	options: RequestOptions = {},
) {
	const fetchImpl = options.fetchImpl ?? fetch;
	const normalizedInput = normalizeSeedanceInput(input);
	const auth = authorization(options.credentials);
	const response = await fetchImpl(ENDPOINT, {
		method: "POST",
		headers: {
			Authorization: auth,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(normalizedInput),
	});
	return parseResponse(response);
}

export async function pollHiggsfieldRequest(
	initial: HiggsfieldResponse,
	options: PollOptions = {},
) {
	const fetchImpl = options.fetchImpl ?? fetch;
	const timeoutMs = options.timeoutMs ?? 15 * 60_000;
	const maxDelayMs = options.maxDelayMs ?? 10_000;
	let delayMs = options.initialDelayMs ?? 2_000;
	let current = initial;
	const startedAt = Date.now();

	while (!TERMINAL_STATUSES.has(current.status)) {
		if (Date.now() - startedAt >= timeoutMs) {
			throw new Error(`Higgsfield polling timed out. Resume request ${current.request_id} later.`);
		}
		const jitteredDelay = Math.max(0, delayMs + delayMs * 0.2 * (Math.random() * 2 - 1));
		await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
		const response = await fetchImpl(current.status_url, {
			headers: { Authorization: authorization(options.credentials) },
		});
		if (response.status >= 500) {
			delayMs = Math.min(maxDelayMs, delayMs * 1.5);
			continue;
		}
		current = await parseResponse(response);
		delayMs = Math.min(maxDelayMs, delayMs * 1.5);
	}

	return current;
}

export async function generateSeedanceVideo(
	input: SeedanceTextToVideoInput,
	options: PollOptions = {},
) {
	return pollHiggsfieldRequest(await submitSeedanceVideo(input, options), options);
}
