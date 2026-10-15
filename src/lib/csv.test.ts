import { describe, expect, it } from "vitest";

import { parseCsv } from "./csv";

describe("parseCsv", () => {
	it("parses simple rows", () => {
		expect(parseCsv("nombre,Url\nA,https://a.com\nB,https://b.com")).toEqual([
			["nombre", "Url"],
			["A", "https://a.com"],
			["B", "https://b.com"],
		]);
	});

	it("handles CRLF line endings without leaving \\r in cells", () => {
		expect(parseCsv("nombre,Url\r\nA,https://a.com\r\n")).toEqual([
			["nombre", "Url"],
			["A", "https://a.com"],
		]);
	});

	it("does not create an extra row for a trailing newline", () => {
		expect(parseCsv("a,b\n1,2\n")).toEqual([
			["a", "b"],
			["1", "2"],
		]);
	});

	it("keeps commas inside quoted cells", () => {
		expect(parseCsv('"Hola, mundo",https://a.com')).toEqual([["Hola, mundo", "https://a.com"]]);
	});

	it("unescapes doubled quotes inside quoted cells", () => {
		expect(parseCsv('"Dijo ""hola""",x')).toEqual([['Dijo "hola"', "x"]]);
	});

	it("keeps newlines inside quoted cells", () => {
		expect(parseCsv('"linea 1\nlinea 2",x')).toEqual([["linea 1\nlinea 2", "x"]]);
	});

	it("returns an empty cell for a blank line so callers can filter it", () => {
		expect(parseCsv("a,b\n\nc,d")).toEqual([["a", "b"], [""], ["c", "d"]]);
	});

	it("returns no rows for empty input", () => {
		expect(parseCsv("")).toEqual([]);
	});
});
