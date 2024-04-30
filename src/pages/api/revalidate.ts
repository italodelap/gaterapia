import type { APIRoute } from "astro";

import { invalidate } from "@/services/isr";

export const GET: APIRoute = () => {
	invalidate("/links");

	return new Response(
		JSON.stringify({
			revalidated: true,
		}),
		{ status: 200 },
	);
};
