/**
 * Auth Routes
 * 
 * POST /auth/google — The login/signup endpoint
 * 
 * Flow:
 * 1. Frontend sends the Google ID token (from "Sign in with Google" button)
 * 2. We verify it with Google's servers (is this token legit?)
 * 3. Extract the user's email and name from the verified token
 * 4. Check if they exist in our Users sheet:
 *    - YES → existing user, proceed (login)
 *    - NO  → new user, add them to the sheet (signup)
 * 5. Create our own JWT session token and set it as an httpOnly cookie
 * 6. Return the user's info to the frontend
 * 
 * GET /auth/me — Check if the current session is still valid
 * POST /auth/logout — Clear the session cookie
 */

import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { findRow, appendRow, TABS } from '../services/sheets.js';
import { requireAuth } from '../middleware/auth.js';
import { getLocalDate } from '../utils/date.js';

const router = Router();

// Create the OAuth2 client for verifying Google ID tokens
const googleClient = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);

/**
 * POST /auth/google
 * Body: { credential: "eyJ..." }  ← the Google ID token from the frontend
 */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential token.' });
    }

    // Step 1: Verify the Google ID token
    // This contacts Google's servers to confirm the token is:
    // - Actually signed by Google
    // - Not expired
    // - Intended for our app (audience matches our client ID)
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || email.split('@')[0];

    if (!payload.email_verified) {
      return res.status(401).json({ error: 'Google email is not verified.' });
    }

    // Step 2: Check if user exists in our Users sheet
    const existingUser = await findRow(TABS.USERS, 'Email', email);

    if (!existingUser) {
      // New user — auto-register (signup)
      const joinedDate = getLocalDate();
      await appendRow(TABS.USERS, [email, name, joinedDate]);
    }

    // Step 3: Create our own JWT session token
    const token = jwt.sign(
      { email, name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Session lasts 7 days
    );

    // Step 4: Set the token as an httpOnly cookie
    // httpOnly: JavaScript can't read it (XSS protection)
    // secure: only sent over HTTPS (in production)
    // sameSite: 'lax' allows the cookie to be sent with top-level navigations
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/',
    });

    // Step 5: Return user info to the frontend
    res.json({
      email,
      name,
      isNewUser: !existingUser,
    });
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ error: 'Invalid Google token. Please try signing in again.' });
  }
});

/**
 * GET /auth/me
 * Check if the user's session is still valid.
 * Used by the frontend on page load to restore the session.
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    email: req.user.email,
    name: req.user.name,
  });
});

/**
 * POST /auth/logout
 * Clear the session cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.json({ message: 'Logged out.' });
});

export default router;
