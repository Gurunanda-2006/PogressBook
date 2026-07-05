import React, { useEffect, useRef, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { formatDate, formatDuration, formatTime, getDayLabel, getToday, shiftDate } from '../utils/formatters';
import './WorkTrackingPage.css';

export default function WorkTrackingPage() {
  const api = useApi();
  const [date, setDate] = useState(getToday());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskPresets, setTaskPresets] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [notes, setNotes] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('activeTimer');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setTaskName(parsed.taskName || '');
      setNotes(parsed.notes || '');
      setActiveSession(parsed);
    } catch {
      localStorage.removeItem('activeTimer');
    }
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await api.get('/api/settings');
      if (data?.TaskPresets) setTaskPresets(data.TaskPresets);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!activeSession) {
      setElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return undefined;
    }

    const start = new Date(activeSession.startTime).getTime();
    const updateElapsed = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    updateElapsed();
    timerRef.current = setInterval(updateElapsed, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeSession]);

  const fetchSessions = async () => {
    setLoading(true);
    const { data } = await api.get('/api/sessions', { params: { date } });
    if (data) setSessions(data.filter((session) => session.EndTime));
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [date]);

  const formatElapsed = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleStart = async () => {
    const trimmedTask = taskName.trim();
    if (!trimmedTask) return;

    setError('');
    const { data, error: startError } = await api.post('/api/sessions/start', {
      taskName: trimmedTask,
      notes: notes.trim(),
      date: getToday(),
    });

    if (data && !startError) {
      const sessionData = {
        sessionId: data.SessionID,
        startTime: data.StartTime,
        taskName: data.TaskName,
        notes: data.Notes || '',
      };
      localStorage.setItem('activeTimer', JSON.stringify(sessionData));
      setActiveSession(sessionData);
    }

    if (startError) setError(startError);
  };

  const handleStop = async () => {
    if (!activeSession) return;

    setError('');
    const { data, error: stopError } = await api.post(`/api/sessions/${activeSession.sessionId}/stop`);
    if (data && !stopError) {
      localStorage.removeItem('activeTimer');
      setActiveSession(null);
      setTaskName('');
      setNotes('');
      fetchSessions();
    }

    if (stopError) setError(stopError);
  };

  const handleDelete = async (id) => {
    const previousSessions = sessions;
    setSessions((current) => current.filter((session) => session.SessionID !== id));
    const { error: deleteError } = await api.del(`/api/sessions/${id}`);
    if (deleteError) setSessions(previousSessions);
  };

  const totalMinutes = sessions.reduce((sum, session) => sum + (Number(session.DurationMin) || 0), 0);

  return (
    <div className="page animate-in">
      <div className="page__header">
        <h1 className="page__title">TIMER</h1>
      </div>

      <div className="timer-section">
        <input
          type="text"
          className="timer-input"
          placeholder="What are you working on?"
          value={taskName}
          onChange={(event) => setTaskName(event.target.value)}
          disabled={activeSession !== null}
          list="task-presets"
        />
        <datalist id="task-presets">
          {taskPresets.map((preset) => (
            <option key={preset} value={preset} />
          ))}
        </datalist>

        <input
          type="text"
          className="timer-input timer-notes"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={activeSession !== null}
        />

        <div className={`timer-display stat-number--large ${activeSession ? 'timer-active' : ''}`}>
          {formatElapsed(elapsed)}
        </div>

        <div className="timer-controls">
          {activeSession ? (
            <button type="button" onClick={handleStop} className="btn btn--accent timer-btn">
              STOP
            </button>
          ) : (
            <button type="button" onClick={handleStart} className="btn btn--outline timer-btn" disabled={!taskName.trim()}>
              START
            </button>
          )}
        </div>

        {error && <div className="login-error">{error}</div>}
      </div>

      <hr className="divider" style={{ margin: 'var(--space-8) 0' }} />

      <div className="history-section">
        <div className="page__header" style={{ marginBottom: 'var(--space-4)' }}>
          <h2 className="page__title">HISTORY</h2>

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

          <div className="history-total">
            <span className="label">TOTAL</span>
            <span className="stat-number">{formatDuration(totalMinutes)}</span>
          </div>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: '80px', marginBottom: '16px' }} />
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">00</div>
            <div className="empty-state__text">No work sessions recorded.</div>
          </div>
        ) : (
          <div className="session-list">
            {sessions.map((session) => (
              <div key={session.SessionID} className="session-card card">
                <div className="session-info">
                  <div className="session-name">{session.TaskName}</div>
                  <div className="session-time">
                    {formatTime(session.StartTime)} to {formatTime(session.EndTime)}
                  </div>
                  {session.Notes && <div className="session-notes">{session.Notes}</div>}
                </div>
                <div className="session-right">
                  <div className="session-duration stat-number">
                    {formatDuration(session.DurationMin)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(session.SessionID)}
                    className="btn btn--ghost session-delete"
                    aria-label="Delete session"
                  >
                    x
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
