/**
 * Settings Routes
 * 
 * GET /api/settings → Read all key-value pairs from the Settings tab
 * 
 * The Settings tab stores app-wide configuration like:
 *   Categories → "Food, Transport, Freelance, Subscriptions"
 *   PaymentMethods → "Cash, UPI, Card, Bank Transfer"
 *   TaskPresets → "DSA, Client Work, YouTube, College"
 * 
 * This route is shared across all users (no UserEmail filtering).
 */

import { Router } from 'express';
import { getRowsAsObjects, TABS } from '../services/sheets.js';

const router = Router();

/**
 * GET /api/settings
 * Returns: { Categories: ["Food", "Transport", ...], PaymentMethods: [...], ... }
 */
router.get('/', async (req, res) => {
  try {
    const rows = await getRowsAsObjects(TABS.SETTINGS);

    // Convert rows to a clean object, splitting comma-separated values into arrays
    const settings = {};
    for (const row of rows) {
      const key = row.Key;
      const value = row.Value || '';
      // Split comma-separated values and trim whitespace
      settings[key] = value.split(',').map(v => v.trim()).filter(Boolean);
    }

    res.json(settings);
  } catch (err) {
    console.error('Get settings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

export default router;
