import type { CollectionEntry } from "astro:content";

type ServiceEntry = CollectionEntry<"services">;
export type FormattedService = ServiceEntry["data"] & { slug: ServiceEntry["id"] };
