import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, sanitizeUser } from '../utils/crypto.js';
import { sanitizeString } from '../middleware/validate.js';
import { verifyTurnstile } from '../middleware/turnstile.js';

describe('Fast Unit Tests — Crypto, Sanitization & Cloudflare Turnstile', () => {
  it('hashes passwords with unique salts and verifies in constant time', () => {
    const h1 = hashPassword('NexusSecret!2026');
    const h2 = hashPassword('NexusSecret!2026');
    assert.notEqual(h1, h2);
    assert.equal(verifyPassword('NexusSecret!2026', h1), true);
    assert.equal(verifyPassword('WrongPass!2026', h1), false);
    assert.throws(() => hashPassword('123'), /at least 8/);
  });

  it('strips passwordHash and XSS characters', () => {
    const safe = sanitizeUser({ id: 'u1', email: 'a@b.com', passwordHash: 'x', role: 'agent' });
    assert.equal('passwordHash' in safe, false);
    assert.equal(sanitizeString('<b>Hi\u0000</b>'), 'bHi/b');
  });

  it('enforces Cloudflare Turnstile when secret is configured', async () => {
    const mw = verifyTurnstile({
      secret: 'cf-secret',
      fetchFn: async () => ({ json: async () => ({ success: true }) })
    });

    let statusCode = 200;
    let nextCalled = false;
    await mw({ headers: {}, body: {}, ip: '1.1.1.1' }, { status: (c) => { statusCode = c; return { json: () => {} }; } }, () => { nextCalled = true; });
    assert.equal(statusCode, 400);
    assert.equal(nextCalled, false);

    await mw({ headers: { 'cf-turnstile-response': 'valid-tok' }, body: {}, ip: '1.1.1.1' }, { status: () => ({ json: () => {} }) }, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
  });
});
