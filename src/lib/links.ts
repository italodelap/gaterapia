import { parseCsv } from "./csv";

const SHEET_URL =
	"https://docs.google.com/spreadsheets/d/e/2PACX-1vTERcp_hbkB3Ww-OzdjfVvUDDojYjT-LlqI1ZY5FcYtYTGMAi4zKOGPrgjpVk0psEBe4xlggAqq1qVJ/pub?output=csv";

export async function fetchLinks() {
	const response = await fetch(SHEET_URL, { signal: AbortSignal.timeout(10_000) });

	if (!response.ok) {
		throw new Error(`[links] Google Sheet respondió ${response.status}`);
	}

	if (!response.headers.get("content-type")?.includes("text/csv")) {
		throw new Error("[links] La respuesta no es CSV (¿la hoja fue despublicada?)");
	}

	const [, ...rows] = parseCsv(await response.text());

	const links = rows
		.map(([link = "", url = ""], order) => ({
			id: String(order),
			order,
			link: link.trim(),
			url: url.trim(),
		}))
		.filter(({ link, url }) => link !== "" || url !== "");

	if (links.length === 0) {
		throw new Error("[links] La hoja no tiene filas");
	}

	return links;
}
