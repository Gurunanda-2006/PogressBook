import { Router } from 'express';
import { appendRow, findRow, findRows, updateRow, TABS } from '../services/sheets.js';
import { getLocalDate, isIsoDate } from '../utils/date.js';
import { generateId } from '../utils/id.js';

const router = Router();

function cleanSession(session) {
  const { _rowIndex, ...rest } = session;
  return rest;
}

router.get('/active', async (req, res) => {
  try {
    const activeSessions = await findRows(TABS.WORK_SESSIONS, (row) => (
      row.UserEmail === req.user.email && !row.EndTime
    ));

    const [latestSession] = activeSessions
      .sort((a, b) => `${b.Date} ${b.StartTime}`.localeCompare(`${a.Date} ${a.StartTime}`));

    res.json(latestSession ? cleanSession(latestSession) : null);
  } catch (err) {
    console.error('Get active session error:', err.message);
    res.status(500).json({ error: 'Failed to fetch active session.' });
  }
});

router.post('/start', async (req, res) => {
  try {
    const { taskName, notes = '', date } = req.body;
    const cleanTaskName = String(taskName || '').trim();
    const cleanNotes = String(notes || '').trim();

    if (!cleanTaskName) {
      return res.status(400).json({ error: 'Task name is required.' });
    }

    const existingActive = await findRows(TABS.WORK_SESSIONS, (row) => (
      row.UserEmail === req.user.email && !row.EndTime
    ));

    if (existingActive.length > 0) {
      return res.status(409).json({
        error: 'You already have a timer running. Stop it before starting a new one.',
      });
    }

    const sessionId = generateId('ses');
    const now = new Date();
    const sessionDate = isIsoDate(date) ? date : getLocalDate(now);
    const startTime = now.toISOString();
    const createdAt = now.toISOString();

    await appendRow(TABS.WORK_SESSIONS, [
      sessionId,
      req.user.email,
      sessionDate,
      cleanTaskName,
      startTime,
      '',
      '',
      cleanNotes,
      createdAt,
    ]);

    res.status(201).json({
      SessionID: sessionId,
      Date: sessionDate,
      TaskName: cleanTaskName,
      StartTime: startTime,
      EndTime: '',
      DurationMin: '',
      Notes: cleanNotes,
      CreatedAt: createdAt,
    });
  } catch (err) {
    console.error('Start session error:', err.message);
    res.status(500).json({ error: 'Failed to start session.' });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await findRow(TABS.WORK_SESSIONS, 'SessionID', id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (session.UserEmail !== req.user.email) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (session.EndTime) {
      return res.status(400).json({ error: 'Session is already stopped.' });
    }

    const endTime = new Date();
    const startTime = new Date(session.StartTime);
    const durationMin = Math.max(0, Math.round((endTime - startTime) / 60000));

    await updateRow(TABS.WORK_SESSIONS, session._rowIndex, [
      session.SessionID,
      session.UserEmail,
      session.Date,
      session.TaskName,
      session.StartTime,
      endTime.toISOString(),
      String(durationMin),
      session.Notes,
      session.CreatedAt,
    ]);

    res.json({
      SessionID: id,
      Date: session.Date,
      TaskName: session.TaskName,
      StartTime: session.StartTime,
      EndTime: endTime.toISOString(),
      DurationMin: String(durationMin),
      Notes: session.Notes,
      CreatedAt: session.CreatedAt,
    });
  } catch (err) {
    console.error('Stop session error:', err.message);
    res.status(500).json({ error: 'Failed to stop session.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { date, from, to } = req.query;

    const sessions = await findRows(TABS.WORK_SESSIONS, (row) => {
      if (row.UserEmail !== req.user.email) return false;
      if (date && row.Date !== date) return false;
      if (from && row.Date < from) return false;
      if (to && row.Date > to) return false;
      return true;
    });

    const cleaned = sessions
      .map(({ _rowIndex, ...rest }) => rest)
      .sort((a, b) => `${b.Date} ${b.StartTime}`.localeCompare(`${a.Date} ${a.StartTime}`));

    res.json(cleaned);
  } catch (err) {
    console.error('Get sessions error:', err.message);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

export default router;
