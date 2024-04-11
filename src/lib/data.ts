import { getCollection } from "astro:content";

import type { FormattedService } from "./types";

export function getServicesDescriptionForSeo(): string {
	const SERVICES = [
		"Catsitting",
		"Terapia Felina",
		"Terapia Floral",
		"Reiki",
		"Registros Akáshicos",
		"Comunicación telepática con animales",
	];

	let phrase = "";
	SERVICES.forEach((service, index) => {
		phrase += index < SERVICES.length - 1 ? `${service}, ` : `y ${service}`;
	});

	return phrase;
}

export async function getFormattedServices(): Promise<FormattedService[]> {
	const services = await getCollection("services");

	return services.map(({ slug, data }) => ({ slug, ...data }));
}
