import assert from "node:assert/strict";
import test from "node:test";

import {
	generateSeedanceVideo,
	normalizeSeedanceInput,
	pollHiggsfieldRequest,
	submitSeedanceVideo,
} from "./seedance.server.ts";

test("rejects invalid Seedance input before making a request", async () => {
	await assert.rejects(
		generateSeedanceVideo({ prompt: "", duration: 3 }),
		/Seedance requires a non-empty prompt/,
	);
	await assert.rejects(
		generateSeedanceVideo({ prompt: "A sunset", duration: 3 }),
		/Seedance duration must be an integer from 4 to 15 seconds/,
	);
});

test("applies the documented Seedance 2.0 defaults", () => {
	assert.deepEqual(normalizeSeedanceInput({ prompt: "  A sunset  ", duration: undefined }), {
		prompt: "A sunset",
		duration: 5,
		resolution: "720p",
		aspect_ratio: "16:9",
		generate_audio: true,
	});
});

test("captures the request ID before polling reaches a terminal state", async () => {
	const queued = {
		status: "queued" as const,
		request_id: "request-1",
		status_url: "https://api.higgsfield.ai/requests/request-1/status",
		cancel_url: "https://api.higgsfield.ai/requests/request-1/cancel",
	};
	let calls = 0;
	const fetchImpl = async () => {
		calls += 1;
		return Response.json(calls === 1 ? queued : { ...queued, status: "completed" });
	};
	const submitted = await submitSeedanceVideo(
		{ prompt: "Hong Kong harbour" },
		{ credentials: "test-id:test-secret", fetchImpl },
	);
	assert.equal(submitted.request_id, "request-1");
	const completed = await pollHiggsfieldRequest(submitted, {
		credentials: "test-id:test-secret",
		fetchImpl,
		initialDelayMs: 0,
	});
	assert.equal(completed.status, "completed");
});
