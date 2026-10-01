import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseCsv } from "./csv.ts";

describe("parseCsv", () => {
	it("parses simple rows", () => {
		assert.deepEqual(parseCsv("nombre,Url\nA,https://a.com\nB,https://b.com"), [
			["nombre", "Url"],
			["A", "https://a.com"],
			["B", "https://b.com"],
		]);
	});

	it("handles CRLF line endings without leaving \\r in cells", () => {
		assert.deepEqual(parseCsv("nombre,Url\r\nA,https://a.com\r\n"), [
			["nombre", "Url"],
			["A", "https://a.com"],
		]);
	});

	it("does not create an extra row for a trailing newline", () => {
		assert.deepEqual(parseCsv("a,b\n1,2\n"), [
			["a", "b"],
			["1", "2"],
		]);
	});

	it("keeps commas inside quoted cells", () => {
		assert.deepEqual(parseCsv('"Hola, mundo",https://a.com'), [["Hola, mundo", "https://a.com"]]);
	});

	it("unescapes doubled quotes inside quoted cells", () => {
		assert.deepEqual(parseCsv('"Dijo ""hola""",x'), [['Dijo "hola"', "x"]]);
	});

	it("keeps newlines inside quoted cells", () => {
		assert.deepEqual(parseCsv('"linea 1\nlinea 2",x'), [["linea 1\nlinea 2", "x"]]);
	});

	it("returns an empty cell for a blank line so callers can filter it", () => {
		assert.deepEqual(parseCsv("a,b\n\nc,d"), [["a", "b"], [""], ["c", "d"]]);
	});

	it("returns no rows for empty input", () => {
		assert.deepEqual(parseCsv(""), []);
	});
});
