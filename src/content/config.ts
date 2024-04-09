import { defineCollection, z } from "astro:content";

const servicesCollection = defineCollection({
	type: "content",
	schema: z.object({
		heroImage: z.string(),
		title: z.string(),
	}),
});

export const collections = {
	services: servicesCollection,
};
