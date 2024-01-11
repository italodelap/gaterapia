import defaultTheme from "tailwindcss/defaultTheme"
import { nextui } from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
		"./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				'cerise-red': {
					'50': '#fdf2f7',
					'100': '#fce7f1',
					'200': '#fccee3',
					'300': '#fba6cb',
					'400': '#f76fa8',
					'500': '#f04487',
					'600': '#e1306c',
					'700': '#c2144a',
					'800': '#a0143d',
					'900': '#851637',
					'950': '#52051c',
				},
			},
			sans: ["Caveat Brush", ...defaultTheme.fontFamily.sans]
		},
	},
	darkMode: "class",
	plugins: [nextui()],
};
