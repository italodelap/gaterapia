import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
	const services = await getCollection("services");

	return rss({
		site: context.site,
		title: "Gaterapia",
		description: "Sitio web de Gaterapia",
		items: services.map((service) => ({
			...service.data,
			pubDate: new Date(),
			link: `/servicios/${service.slug}`,
		})),
	});
}
