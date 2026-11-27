import { ZodError } from 'zod';

export function sanitizeString(val) {
  if (typeof val !== 'string') return val;
  return val.replace(/[\u0000-\u001F\u007F]/g, '').replace(/[<>]/g, '').trim();
}

export function sanitizePayload(obj, skipKeys = new Set(['password'])) {
  if (Array.isArray(obj)) return obj.map(i => sanitizePayload(i, skipKeys));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = skipKeys.has(k) ? v : sanitizePayload(v, skipKeys);
    }
    return out;
  }
  return typeof obj === 'string' ? sanitizeString(obj) : obj;
}

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(sanitizePayload(req.body || {}));
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors.map(e => ({ field: e.path.join('.') || 'body', message: e.message }))
        });
      }
      next(err);
    }
  };
}
