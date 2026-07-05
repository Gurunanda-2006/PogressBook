import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDuration, getDateRange, getMonthRange, getWeekDates } from '../utils/formatters';
import './DashboardPage.css';

const COLORS = ['#1A1A1A', '#C8964E', '#3D8C5C', '#C44D4D', '#6B6B6B', '#9B9B9B'];

const getShortDay = (dateStr) => (
  new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' })
);

const getShortDate = (dateStr) => (
  new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
);

export default function DashboardPage() {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [weeklySessions, setWeeklySessions] = useState([]);
  const [weeklyTodos, setWeeklyTodos] = useState([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const week = getWeekDates();
      const month = getMonthRange();

      const [sessionsRes, todosRes, transactionsRes] = await Promise.all([
        api.get('/api/sessions', { params: { from: week[0], to: week[6] } }),
        api.get('/api/todos', { params: { from: week[0], to: week[6] } }),
        api.get('/api/transactions', { params: { from: month.from, to: month.to } }),
      ]);

      if (sessionsRes.data) setWeeklySessions(sessionsRes.data);
      if (todosRes.data) setWeeklyTodos(todosRes.data);
      if (transactionsRes.data) setMonthlyTransactions(transactionsRes.data);
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const totalWeeklyMinutes = weeklySessions.reduce((sum, session) => sum + (Number(session.DurationMin) || 0), 0);
  const tasksCompleted = weeklyTodos.filter((task) => task.Status === 'completed').length;
  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.Type === 'income')
    .reduce((sum, transaction) => sum + Number(transaction.Amount), 0);
  const monthlyExpense = monthlyTransactions
    .filter((transaction) => transaction.Type === 'expense')
    .reduce((sum, transaction) => sum + Number(transaction.Amount), 0);

  const weekDates = getWeekDates();
  const workChartData = weekDates.map((dateStr) => {
    const minutes = weeklySessions
      .filter((session) => session.Date === dateStr)
      .reduce((sum, session) => sum + (Number(session.DurationMin) || 0), 0);

    return {
      day: getShortDay(dateStr),
      hours: Number((minutes / 60).toFixed(1)),
    };
  });

  const expenseByCategory = monthlyTransactions
    .filter((transaction) => transaction.Type === 'expense')
    .reduce((groups, transaction) => {
      const key = transaction.Category || 'Other';
      groups[key] = (groups[key] || 0) + Number(transaction.Amount);
      return groups;
    }, {});

  const pieData = Object.entries(expenseByCategory)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const month = getMonthRange();
  const trendData = getDateRange(month.from, month.to).map((dateStr) => {
    const dayTransactions = monthlyTransactions.filter((transaction) => transaction.Date === dateStr);
    return {
      date: getShortDate(dateStr),
      income: dayTransactions
        .filter((transaction) => transaction.Type === 'income')
        .reduce((sum, transaction) => sum + Number(transaction.Amount), 0),
      expense: dayTransactions
        .filter((transaction) => transaction.Type === 'expense')
        .reduce((sum, transaction) => sum + Number(transaction.Amount), 0),
    };
  });

  if (loading) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title">STATS</h1>
        </div>
        <div className="skeleton" style={{ height: '120px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ height: '300px' }} />
      </div>
    );
  }

  return (
    <div className="page animate-in dashboard-page">
      <div className="page__header">
        <h1 className="page__title">STATS</h1>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="label">HOURS THIS WEEK</div>
          <div className="stat-number">{formatDuration(totalWeeklyMinutes)}</div>
        </div>
        <div className="card stat-card">
          <div className="label">TASKS DONE</div>
          <div className="stat-number">{tasksCompleted}</div>
        </div>
        <div className="card stat-card">
          <div className="label">INCOME (MONTH)</div>
          <div className="stat-number" style={{ color: 'var(--success)' }}>{formatCurrency(monthlyIncome)}</div>
        </div>
        <div className="card stat-card">
          <div className="label">EXPENSE (MONTH)</div>
          <div className="stat-number" style={{ color: 'var(--danger)' }}>{formatCurrency(monthlyExpense)}</div>
        </div>
      </div>

      <div className="charts-container">
        <div className="card chart-card">
          <h2 className="label" style={{ marginBottom: 'var(--space-4)' }}>WORK HOURS (THIS WEEK)</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <RechartsTooltip
                  cursor={{ fill: 'var(--bg-elevated)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                />
                <Bar dataKey="hours" fill="var(--text-primary)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <h2 className="label" style={{ marginBottom: 'var(--space-4)' }}>EXPENSES BY CATEGORY</h2>
          <div className="chart-wrapper chart-wrapper--centered">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={56} outerRadius={82} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <div className="empty-state__text">No expenses this month.</div>
              </div>
            )}
          </div>

          {pieData.length > 0 && (
            <div className="pie-legend">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="pie-legend__item">
                  <div className="pie-legend__color" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div className="pie-legend__label">{entry.name}</div>
                  <div className="pie-legend__value">{formatCurrency(entry.value)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card chart-card chart-card--wide">
          <h2 className="label" style={{ marginBottom: 'var(--space-4)' }}>INCOME VS EXPENSE (THIS MONTH)</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} minTickGap={22} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <RechartsTooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="income" stroke="var(--success)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="var(--danger)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
