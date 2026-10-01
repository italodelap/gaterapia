import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const servicesCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
	schema: z.object({
		title: z.string(),
	}),
});

export const collections = {
	services: servicesCollection,
};
