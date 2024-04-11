import { defineCollection, z } from "astro:content";

const servicesCollection = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		subtitle: z.string().optional(),
	}),
});

export const collections = {
	services: servicesCollection,
};
