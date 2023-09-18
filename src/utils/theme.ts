enum TailwindTheme {
  DARK_THEME = "dark",
  LIGHT_THEME = "light",
}

export function handleSwitcherChange(): void {
	const isDarkThemeSelected = localStorage.getItem("tw-theme") === TailwindTheme.DARK_THEME;

	const htmlTag = document.querySelector("html")!;
	const themeMetaTag = document.head.children.namedItem("theme-color");

	// @ts-ignore
	if (themeMetaTag) { themeMetaTag.content = isDarkThemeSelected ? "#e5e5e5" : "#262626"; }

	htmlTag.classList[isDarkThemeSelected ? "remove" : "add"](TailwindTheme.DARK_THEME);
	localStorage.setItem("tw-theme", isDarkThemeSelected ? TailwindTheme.LIGHT_THEME : TailwindTheme.DARK_THEME);
}
