/**
 * Transaction Routes (Income & Expense)
 * 
 * POST /api/transactions       → Add a new income or expense entry
 * GET  /api/transactions?from=&to= → List transactions with optional date range
 */

import { Router } from 'express';
import { findRows, appendRow, TABS } from '../services/sheets.js';
import { generateId } from '../utils/id.js';
import { getLocalDate, isIsoDate } from '../utils/date.js';

const router = Router();

/**
 * POST /api/transactions
 * Body: { date, type: "income"|"expense", category, amount, paymentMethod, notes }
 */
router.post('/', async (req, res) => {
  try {
    const { date, type, category, amount, paymentMethod, notes = '' } = req.body;
    const normalizedType = String(type || '').toLowerCase();

    // Validate required fields
    if (!type || !category || amount === undefined) {
      return res.status(400).json({ error: 'Type, category, and amount are required.' });
    }

    if (!['income', 'expense'].includes(normalizedType)) {
      return res.status(400).json({ error: 'Type must be "income" or "expense".' });
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
    }

    const entryId = generateId('txn');
    const now = new Date();
    const entryDate = isIsoDate(date) ? date : getLocalDate(now);
    const createdAt = now.toISOString();

    // Row: EntryID | UserEmail | Date | Type | Category | Amount | PaymentMethod | Notes | CreatedAt
    await appendRow(TABS.INCOME_EXPENSE, [
      entryId,
      req.user.email,
      entryDate,
      normalizedType,
      category,
      String(amount),
      paymentMethod || '',
      notes,
      createdAt,
    ]);

    res.status(201).json({
      EntryID: entryId,
      Date: entryDate,
      Type: normalizedType,
      Category: category,
      Amount: Number(amount),
      PaymentMethod: paymentMethod || '',
      Notes: notes,
      CreatedAt: createdAt,
    });
  } catch (err) {
    console.error('Create transaction error:', err.message);
    res.status(500).json({ error: 'Failed to create transaction.' });
  }
});

/**
 * GET /api/transactions?from=2026-07-01&to=2026-07-31&type=expense
 */
router.get('/', async (req, res) => {
  try {
    const { from, to, type } = req.query;
    const normalizedType = type ? String(type).toLowerCase() : '';

    const transactions = await findRows(TABS.INCOME_EXPENSE, (row) => {
      if (row.UserEmail !== req.user.email) return false;
      if (from && row.Date < from) return false;
      if (to && row.Date > to) return false;
      if (normalizedType && row.Type !== normalizedType) return false;
      return true;
    });

    const cleaned = transactions
      .map(({ _rowIndex, ...rest }) => ({
        ...rest,
        Amount: Number(rest.Amount) || 0,
      }))
      .sort((a, b) => `${b.Date} ${b.CreatedAt}`.localeCompare(`${a.Date} ${a.CreatedAt}`));

    res.json(cleaned);
  } catch (err) {
    console.error('Get transactions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

export default router;
