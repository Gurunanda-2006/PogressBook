/**
 * Authentication Middleware
 * 
 * This middleware runs BEFORE every protected route. It:
 * 1. Reads the JWT from the httpOnly cookie
 * 2. Verifies the JWT signature using our secret
 * 3. Attaches the user info (email, name) to `req.user`
 * 4. If the token is missing or invalid, returns 401 Unauthorized
 * 
 * Why httpOnly cookies?
 * - The browser sends them automatically with every request
 * - JavaScript on the page can't read them (prevents XSS token theft)
 * - More secure than storing tokens in localStorage
 */

import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated. Please sign in.' });
  }

  try {
    // Verify the token and extract the payload (email, name)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}
