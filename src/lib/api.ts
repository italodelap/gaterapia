import { type Link } from "./types.d";

export const api = {
	links: {
		async getAll(): Promise<Link[]> {
			const csv = await fetch(
				"https://docs.google.com/spreadsheets/d/e/2PACX-1vTERcp_hbkB3Ww-OzdjfVvUDDojYjT-LlqI1ZY5FcYtYTGMAi4zKOGPrgjpVk0psEBe4xlggAqq1qVJ/pub?output=csv",
			).then((response) => response.text());

			const links = csv
				.split("\n")
				.slice(1)
				.map((row) => {
					const [link, url] = row.split(",");

					return { link, url };
				});

			return links;
		},
	},
};
