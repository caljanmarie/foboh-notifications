export class RateLimitService {
  private windows = new Map<string, number[]>();

  // Allow 'limit' requests per 'windowMs' milliseconds
  constructor(private limit = 5, private windowMs = 60_000) {} // 5 requests per minute

  // Returns true if under limit, false if exceeded
  check(userId: string) {
    const now = Date.now();
    const arr = this.windows.get(userId) ?? [];
    const filtered = arr.filter((t) => now - t < this.windowMs);
    filtered.push(now);
    this.windows.set(userId, filtered);
    return filtered.length <= this.limit;
  }
}