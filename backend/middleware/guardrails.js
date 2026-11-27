import crypto from 'crypto';

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /reveal\s+(your\s+)?(system\s+prompt|secrets?|env|jwt_secret|database_url)/i,
  /\b(union\s+select|drop\s+table|;\s*delete\s+from)\b/i,
  /<script\b[^>]*>[\s\S]*?<\/script>/i
];

const SECRET_PATTERNS = [
  /scrypt\$[a-f0-9]+\$[a-f0-9]+/gi,
  /postgresql:\/\/[^\s]+/gi,
  /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi
];

export function redactSecrets(text) {
  if (typeof text !== 'string') return text;
  let out = text;
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, '[REDACTED]');
  }
  return out;
}

export function detectPromptInjection(text) {
  if (typeof text !== 'string') return false;
  return INJECTION_PATTERNS.some(re => re.test(text));
}

/**
 * Middleware: Attaches X-Request-Id and enforces prompt/SQL/XSS guardrails on user text inputs.
 */
export function securityGuardrails(db) {
  return async (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
    res.setHeader('X-Request-Id', req.requestId);

    const fieldsToInspect = [
      req.body?.message,
      req.body?.subject,
      req.body?.description
    ].filter(v => typeof v === 'string');

    for (const value of fieldsToInspect) {
      if (detectPromptInjection(value)) {
        if (db?.createAuditLog) {
          await db.createAuditLog({
            id: `AUD-${crypto.randomUUID().slice(0, 8)}`,
            userId: req.user?.id || null,
            userEmail: req.user?.email || null,
            userRole: req.user?.role || null,
            action: 'GUARDRAIL_BLOCKED',
            resource: req.originalUrl,
            details: { reason: 'Suspicious prompt/SQL/script injection pattern detected', requestId: req.requestId },
            ipAddress: req.ip
          }).catch(() => {});
        }
        return res.status(400).json({
          error: 'Security Guardrail: Request blocked due to unsafe instruction or injection pattern.',
          requestId: req.requestId
        });
      }
    }

    next();
  };
}
