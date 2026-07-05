import { Router } from 'express';
import { appendRow, findRow, findRows, updateRow, TABS } from '../services/sheets.js';
import { getLocalDate, isIsoDate } from '../utils/date.js';
import { generateId } from '../utils/id.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { date, dayLabel, taskName } = req.body;
    const cleanTaskName = String(taskName || '').trim();

    if (!cleanTaskName) {
      return res.status(400).json({ error: 'Task name is required.' });
    }

    const taskId = generateId('todo');
    const now = new Date();
    const taskDate = isIsoDate(date) ? date : getLocalDate(now);
    const day = dayLabel || now.toLocaleDateString('en-US', { weekday: 'long' });
    const createdTime = now.toISOString();

    await appendRow(TABS.TODO_LIST, [
      taskId,
      req.user.email,
      taskDate,
      day,
      cleanTaskName,
      'pending',
      createdTime,
      '',
    ]);

    res.status(201).json({
      TaskID: taskId,
      Date: taskDate,
      DayLabel: day,
      TaskName: cleanTaskName,
      Status: 'pending',
      CreatedTime: createdTime,
      CompletedTime: '',
    });
  } catch (err) {
    console.error('Create todo error:', err.message);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, taskName } = req.body;
    const todo = await findRow(TABS.TODO_LIST, 'TaskID', id);

    if (!todo) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (todo.UserEmail !== req.user.email) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (status && !['pending', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be pending or completed.' });
    }

    const updatedStatus = status || todo.Status;
    const cleanTaskName = typeof taskName === 'string' ? taskName.trim() : '';
    const updatedName = cleanTaskName || todo.TaskName;
    let completedTime = todo.CompletedTime;

    if (status === 'completed' && todo.Status !== 'completed') {
      completedTime = new Date().toISOString();
    }

    if (status === 'pending') {
      completedTime = '';
    }

    await updateRow(TABS.TODO_LIST, todo._rowIndex, [
      todo.TaskID,
      todo.UserEmail,
      todo.Date,
      todo.DayLabel,
      updatedName,
      updatedStatus,
      todo.CreatedTime,
      completedTime,
    ]);

    res.json({
      TaskID: id,
      Date: todo.Date,
      DayLabel: todo.DayLabel,
      TaskName: updatedName,
      Status: updatedStatus,
      CreatedTime: todo.CreatedTime,
      CompletedTime: completedTime,
    });
  } catch (err) {
    console.error('Update todo error:', err.message);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { date, from, to } = req.query;

    const todos = await findRows(TABS.TODO_LIST, (row) => {
      if (row.UserEmail !== req.user.email) return false;
      if (date && row.Date !== date) return false;
      if (from && row.Date < from) return false;
      if (to && row.Date > to) return false;
      return true;
    });

    const cleaned = todos
      .map(({ _rowIndex, ...rest }) => rest)
      .sort((a, b) => `${b.Date} ${b.CreatedTime}`.localeCompare(`${a.Date} ${a.CreatedTime}`));

    res.json(cleaned);
  } catch (err) {
    console.error('Get todos error:', err.message);
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
});

export default router;
