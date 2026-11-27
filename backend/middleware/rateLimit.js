export function createRateLimiter({ windowMs = 60_000, max = 100, message = 'Too many requests, please try again later.' } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const cutoff = now - windowMs;
    const arr = (hits.get(key) || []).filter(ts => ts > cutoff);
    if (arr.length >= max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((arr[0] + windowMs - now) / 1000))));
      return res.status(429).json({ error: message });
    }
    arr.push(now);
    hits.set(key, arr);
    next();
  };
}
