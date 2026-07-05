import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requireAuth } from './middleware/auth.js';
import { ensureSpreadsheetSchema, findRow, deleteRow, TABS } from './services/sheets.js';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import todoRoutes from './routes/todos.js';
import transactionRoutes from './routes/transactions.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_CLIENT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function getAllowedOrigins() {
  const configuredOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([...DEFAULT_CLIENT_ORIGINS, ...configuredOrigins]);
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || getAllowedOrigins().has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/api/sessions', requireAuth, sessionRoutes);
app.use('/api/todos', requireAuth, todoRoutes);
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);

const SHEET_MAP = {
  sessions: { tab: TABS.WORK_SESSIONS, idCol: 'SessionID' },
  todos: { tab: TABS.TODO_LIST, idCol: 'TaskID' },
  transactions: { tab: TABS.INCOME_EXPENSE, idCol: 'EntryID' },
};

app.delete('/api/:sheet/:id', requireAuth, async (req, res) => {
  try {
    const { sheet, id } = req.params;
    const mapping = SHEET_MAP[sheet];

    if (!mapping) {
      return res.status(400).json({ error: 'Unknown sheet. Use sessions, todos, or transactions.' });
    }

    const row = await findRow(mapping.tab, mapping.idCol, id);
    if (!row) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    if (row.UserEmail !== req.user.email) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await deleteRow(mapping.tab, row._rowIndex);
    res.json({ message: 'Deleted successfully.', id });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ProgressBook API is running', timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    await ensureSpreadsheetSchema();
    app.listen(PORT, () => {
      console.log(`ProgressBook server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start ProgressBook server:', err.message);
    process.exit(1);
  }
}

startServer();
