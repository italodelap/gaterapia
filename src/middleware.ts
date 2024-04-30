import type { APIContext, MiddlewareHandler } from "astro";

import { isr } from "./services/isr";

const shouldSkipCache = (req: APIContext) => {
	if (req.url.pathname !== "/links") {
		return true;
	}

	if (req.request.method !== "GET") {
		return true;
	}

	return false;
};

export const onRequest: MiddlewareHandler = async (req, next) => {
	const key = req.url.pathname;

	if (shouldSkipCache(req)) {
		return next();
	}

	const cachedResponse = isr.get(key);
	if (cachedResponse) {
		return cachedResponse;
	}

	const response = await next();

	isr.set(key, response);

	return response;
};
