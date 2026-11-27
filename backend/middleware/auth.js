import jwt from 'jsonwebtoken';
import { verifyToken as verifyClerkToken } from '@clerk/backend';
import { config } from '../config/env.js';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export async function resolveAuth(token, db, clerkVerifier = verifyClerkToken) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await db.findUserById(decoded.sub);
    if (user && user.isActive) return { ...user, authProvider: 'local-jwt' };
    return null;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const e = new Error('Session expired. Please sign in again.');
      e.code = 'TOKEN_EXPIRED';
      throw e;
    }
  }

  if (config.clerkSecretKey) {
    try {
      const claims = await clerkVerifier(token, { secretKey: config.clerkSecretKey });
      const role = claims.public_metadata?.role || claims.metadata?.role || 'customer';
      return {
        id: claims.sub,
        clerkId: claims.sub,
        email: claims.email || `${claims.sub}@clerk.local`,
        fullName: claims.full_name || 'Clerk User',
        role: ['admin', 'agent', 'customer'].includes(role) ? role : 'customer',
        isActive: true,
        authProvider: 'clerk'
      };
    } catch {
      return null;
    }
  }
  return null;
}

export function authenticateToken(db, options = {}) {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    }
    const token = header.slice(7).trim();
    if (!token) return res.status(401).json({ error: 'Authentication required. Empty token.' });

    try {
      const user = await resolveAuth(token, db, options.clerkVerifier);
      if (!user) return res.status(401).json({ error: 'Invalid authentication token.' });
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: err.message || 'Invalid authentication token.' });
    }
  };
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden. Requires one of roles: ${roles.join(', ')}.` });
    }
    next();
  };
}

export function optionalAuth(db) {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return next();
    try {
      const user = await resolveAuth(header.slice(7).trim(), db);
      if (user) req.user = user;
    } catch {
      // ignore
    }
    next();
  };
}
