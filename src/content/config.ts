import { defineCollection, z } from "astro:content";

const servicesCollection = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
	}),
});

export const collections = {
	services: servicesCollection,
};
