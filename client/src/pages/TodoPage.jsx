import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { formatDate, getDayLabel, getToday, shiftDate } from '../utils/formatters';
import './TodoPage.css';

export default function TodoPage() {
  const api = useApi();
  const [date, setDate] = useState(getToday());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskName, setNewTaskName] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await api.get('/api/todos', { params: { date } });
    if (data) setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [date]);

  const handleAddTask = async (event) => {
    event.preventDefault();
    const taskName = newTaskName.trim();
    if (!taskName) return;

    const { data } = await api.post('/api/todos', {
      date,
      dayLabel: getDayLabel(date),
      taskName,
    });

    if (data) {
      setTasks((current) => [...current, data]);
      setNewTaskName('');
    }
  };

  const handleToggleTask = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setTasks((current) => current.map((task) => (
      task.TaskID === id
        ? { ...task, Status: nextStatus, CompletedTime: nextStatus === 'pending' ? '' : task.CompletedTime }
        : task
    )));

    const { data, error } = await api.patch(`/api/todos/${id}`, { status: nextStatus });
    if (data) {
      setTasks((current) => current.map((task) => (task.TaskID === id ? data : task)));
    }

    if (error) {
      setTasks((current) => current.map((task) => (
        task.TaskID === id ? { ...task, Status: currentStatus } : task
      )));
    }
  };

  const handleDeleteTask = async (id) => {
    const previousTasks = tasks;
    setTasks((current) => current.filter((task) => task.TaskID !== id));
    const { error } = await api.del(`/api/todos/${id}`);
    if (error) setTasks(previousTasks);
  };

  const pendingTasks = tasks.filter((task) => task.Status !== 'completed');
  const completedTasks = tasks.filter((task) => task.Status === 'completed');
  const sortedTasks = [...pendingTasks, ...completedTasks];
  const completedCount = completedTasks.length;
  const totalCount = tasks.length;
  const progressPercent = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  return (
    <div className="page animate-in">
      <div className="page__header">
        <h1 className="page__title">TASKS</h1>

        <div className="date-nav">
          <button
            type="button"
            onClick={() => setDate(shiftDate(date, -1))}
            className="btn btn--ghost date-nav__btn"
            aria-label="Previous day"
          >
            &lt;
          </button>
          <div className="date-nav__current">
            <span className="date-nav__day">{getDayLabel(date)}, </span>
            <span className="date-nav__date">{formatDate(date)}</span>
          </div>
          <button
            type="button"
            onClick={() => setDate(shiftDate(date, 1))}
            className="btn btn--ghost date-nav__btn"
            aria-label="Next day"
          >
            &gt;
          </button>
        </div>

        <div className="progress-section">
          <div className="progress-stats">
            <span className="stat-number">{completedCount}</span>
            <span className="label"> / {totalCount} COMPLETED</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <form onSubmit={handleAddTask} className="add-task-form">
        <input
          type="text"
          className="add-task-input"
          placeholder="What needs to be done?"
          value={newTaskName}
          onChange={(event) => setNewTaskName(event.target.value)}
        />
        <button type="submit" className="btn btn--primary" disabled={!newTaskName.trim()}>
          ADD
        </button>
      </form>

      {loading ? (
        <div className="task-list">
          <div className="skeleton task-row" style={{ height: '56px', borderBottom: 'none' }} />
          <div className="skeleton task-row" style={{ height: '56px', borderBottom: 'none', marginTop: '8px' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">OK</div>
          <div className="empty-state__text">No tasks for this day.</div>
        </div>
      ) : (
        <div className="task-list">
          {sortedTasks.map((task) => (
            <div key={task.TaskID} className={`task-row ${task.Status === 'completed' ? 'task-row--completed' : ''}`}>
              <button
                type="button"
                className={`task-checkbox ${task.Status === 'completed' ? 'task-checkbox--checked' : ''}`}
                onClick={() => handleToggleTask(task.TaskID, task.Status)}
                aria-label={task.Status === 'completed' ? 'Mark task pending' : 'Mark task complete'}
              />

              <span className="task-name">{task.TaskName}</span>

              <button
                type="button"
                onClick={() => handleDeleteTask(task.TaskID)}
                className="btn btn--ghost task-delete"
                aria-label="Delete task"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
