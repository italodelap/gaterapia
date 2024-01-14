import { type Link } from "./types.d";

export const api = {
  links: {
    getAll: async function() : Promise<Link[]> {
      const csv = await fetch(
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRvSiNUT8d0BcHO7uJ9gKKRQ0TNx0OAStlJy39gKWyByCwfU1yB92u-jtilOcO906QYZhQcblSi94Su/pub?output=csv",
      ).then((response) => response.text());

      const links = csv
      .split("\n")
      .slice(1)
      .map((row) => {
        const [link, url] = row.split(",");
        return { link, url };
      });

      return links
    }
  }
}
