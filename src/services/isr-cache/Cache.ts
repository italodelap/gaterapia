export interface Cache<P> {
	// Get a value from the cache.
	get(key: string): P | undefined;
	// Set a value in the cache.
	set(key: string, value: P): void;
	// Delete a value from the cache.
	del(key: string): void;
}
