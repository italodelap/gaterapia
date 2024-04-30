import type { Cache } from "./Cache";

type CacheEntry<P> = {
	value: P;
};

export class MemoryCache<P> implements Cache<P> {
	private readonly cache: Map<string, CacheEntry<P>> = new Map();

	get(key: string): P | undefined {
		const entry = this.cache.get(key);
		if (!entry) {
			return undefined;
		}

		return entry.value;
	}

	set(key: string, value: P): void {
		this.cache.set(key, { value });
	}

	del(key: string): void {
		this.cache.delete(key);
	}
}
