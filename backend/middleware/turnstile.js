import { config } from '../config/env.js';

/**
 * Verifies Cloudflare Turnstile token when CF_TURNSTILE_SECRET is configured.
 */
export function verifyTurnstile(options = {}) {
  const fetchFn = options.fetchFn || fetch;
  return async (req, res, next) => {
    const secret = options.secret ?? config.cfTurnstileSecret;
    if (!secret) return next();

    const token = req.headers['cf-turnstile-response'] || req.body?.turnstileToken;
    if (!token) {
      return res.status(400).json({ error: 'Cloudflare Turnstile verification token is required.' });
    }

    try {
      const form = new URLSearchParams({ secret, response: token, remoteip: req.ip || '' });
      const r = await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: form
      });
      const data = await r.json();
      if (!data.success) {
        return res.status(403).json({ error: 'Cloudflare Turnstile verification failed.' });
      }
      next();
    } catch {
      return res.status(502).json({ error: 'Unable to verify Cloudflare Turnstile token.' });
    }
  };
}
