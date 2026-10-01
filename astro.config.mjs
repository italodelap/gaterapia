// @ts-check
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	// TODO: quitar y adoptar el default 'jsx' de Astro 7 (ver commit de whitespace)
	compressHTML: true,
	site: "https://www.gaterapia.com",
	integrations: [sitemap()],
	vite: { plugins: [tailwindcss()] },
});
