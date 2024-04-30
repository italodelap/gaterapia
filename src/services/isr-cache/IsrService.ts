import type { Cache } from "./Cache";

export class IsrService implements Cache<Response> {
	constructor(private readonly cache: Cache<Response>) {}

	get(key: string): Response | undefined {
		// eslint-disable-next-line no-console
		console.log(`[isr] get ${key}`);
		const result = this.cache.get(key);
		if (!result) {
			return undefined;
		}

		return result.clone();
	}

	set(key: string, value: Response): void {
		// eslint-disable-next-line no-console
		console.log(`[isr] set ${key}`);
		// Clone the response so that we don't modify the original.
		this.cache.set(key, value.clone());
	}

	del(key: string): void {
		// eslint-disable-next-line no-console
		console.log(`[isr] del ${key}`);
		this.cache.del(key);
	}
}
