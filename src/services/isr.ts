import { IsrService } from "./isr-cache/IsrService";
import { MemoryCache } from "./isr-cache/MemoryCache";

const cache = new MemoryCache<Response>();
export const isr = new IsrService(cache);

export function invalidate(key: string): void {
	isr.del(key);
}
