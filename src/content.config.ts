import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { fetchLinks } from "./lib/links";

const servicesCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
	schema: z.object({
		title: z.string(),
	}),
});

const linksCollection = defineCollection({
	loader: fetchLinks,
	schema: z.object({
		order: z.number(),
		link: z.string().min(1),
		url: z.url({ protocol: /^https?$/ }),
	}),
});

export const collections = {
	services: servicesCollection,
	links: linksCollection,
};
