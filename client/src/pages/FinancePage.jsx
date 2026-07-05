import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDate, getMonthRange, getToday } from '../utils/formatters';
import './FinancePage.css';

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Freelance', 'Subscriptions', 'Salary'];
const DEFAULT_PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

export default function FinancePage() {
  const api = useApi();
  const monthRange = getMonthRange();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [fromDate, setFromDate] = useState(monthRange.from);
  const [toDate, setToDate] = useState(monthRange.to);
  const [typeFilter, setTypeFilter] = useState('all');
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(DEFAULT_PAYMENT_METHODS[0]);
  const [date, setDate] = useState(getToday());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await api.get('/api/settings');
      if (!data) return;

      const nextCategories = data.Categories?.length ? data.Categories : DEFAULT_CATEGORIES;
      const nextPaymentMethods = data.PaymentMethods?.length ? data.PaymentMethods : DEFAULT_PAYMENT_METHODS;
      setCategories(nextCategories);
      setPaymentMethods(nextPaymentMethods);
      setCategory((current) => current || nextCategories[0]);
      setPaymentMethod((current) => current || nextPaymentMethods[0]);
    };
    fetchSettings();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const params = { from: fromDate, to: toDate };
    if (typeFilter !== 'all') params.type = typeFilter;

    const { data } = await api.get('/api/transactions', { params });
    if (data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [fromDate, toDate, typeFilter]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!amount || Number.isNaN(Number(amount))) return;

    const { data } = await api.post('/api/transactions', {
      date,
      type,
      category,
      amount: Number(amount),
      paymentMethod,
      notes,
    });

    if (data) {
      setAmount('');
      setNotes('');
      const isInDateRange = date >= fromDate && date <= toDate;
      const isInTypeFilter = typeFilter === 'all' || typeFilter === data.Type;
      if (isInDateRange && isInTypeFilter) {
        setTransactions((current) => [data, ...current]);
      }
    }
  };

  const handleDelete = async (id) => {
    const previousTransactions = transactions;
    setTransactions((current) => current.filter((transaction) => transaction.EntryID !== id));
    const { error } = await api.del(`/api/transactions/${id}`);
    if (error) setTransactions(previousTransactions);
  };

  const totalIncome = transactions
    .filter((transaction) => transaction.Type === 'income')
    .reduce((sum, transaction) => sum + Number(transaction.Amount), 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.Type === 'expense')
    .reduce((sum, transaction) => sum + Number(transaction.Amount), 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="page animate-in">
      <div className="page__header">
        <h1 className="page__title">MONEY</h1>
      </div>

      <div className="finance-summary">
        <div className="card summary-card">
          <div className="label">INCOME</div>
          <div className="stat-number summary-card__income">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="card summary-card">
          <div className="label">EXPENSE</div>
          <div className="stat-number summary-card__expense">{formatCurrency(totalExpense)}</div>
        </div>
        <div className="card summary-card">
          <div className="label">BALANCE</div>
          <div className={`stat-number ${balance >= 0 ? 'summary-card__balance-pos' : 'summary-card__balance-neg'}`}>
            {formatCurrency(balance)}
          </div>
        </div>
      </div>

      <hr className="divider" style={{ margin: 'var(--space-6) 0' }} />

      <form className="finance-form card" onSubmit={handleSubmit}>
        <div className="toggle-group" style={{ marginBottom: 'var(--space-4)' }}>
          <button
            type="button"
            className={`toggle-group__btn ${type === 'expense' ? 'toggle-group__btn--active' : ''}`}
            onClick={() => setType('expense')}
          >
            EXPENSE
          </button>
          <button
            type="button"
            className={`toggle-group__btn ${type === 'income' ? 'toggle-group__btn--active' : ''}`}
            onClick={() => setType('income')}
          >
            INCOME
          </button>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="label">AMOUNT</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label className="label">DATE</label>
            <input
              type="date"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label">CATEGORY</label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} required>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="label">PAYMENT METHOD</label>
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} required>
              {paymentMethods.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
          <label className="label">NOTES (OPTIONAL)</label>
          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="What was this for?"
          />
        </div>

        <button type="submit" className="btn btn--primary" style={{ marginTop: 'var(--space-4)', width: '100%' }}>
          SAVE ENTRY
        </button>
      </form>

      <hr className="divider" style={{ margin: 'var(--space-6) 0' }} />

      <div className="finance-list-section">
        <div className="toggle-group finance-type-filter">
          {['all', 'expense', 'income'].map((item) => (
            <button
              key={item}
              type="button"
              className={`toggle-group__btn ${typeFilter === item ? 'toggle-group__btn--active' : ''}`}
              onClick={() => setTypeFilter(item)}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="finance-filters">
          <div className="form-group">
            <label className="label">FROM</label>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">TO</label>
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: '80px' }} />
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">0</div>
            <div className="empty-state__text">No transactions found in this date range.</div>
          </div>
        ) : (
          <div className="transaction-list">
            {transactions.map((transaction) => (
              <div key={transaction.EntryID} className="transaction-row">
                <div className="transaction-main">
                  <div className="transaction-category">{transaction.Category}</div>
                  <div className="transaction-date">{formatDate(transaction.Date)}</div>
                  {transaction.Notes && <div className="transaction-notes">{transaction.Notes}</div>}
                </div>

                <div className="transaction-right">
                  <div className="transaction-badges">
                    <span className="badge">{transaction.PaymentMethod}</span>
                  </div>
                  <div className={`transaction-amount stat-number ${transaction.Type === 'income' ? 'summary-card__income' : 'summary-card__expense'}`}>
                    {transaction.Type === 'income' ? '+' : '-'}{formatCurrency(transaction.Amount)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(transaction.EntryID)}
                    className="btn btn--ghost transaction-delete"
                    aria-label="Delete transaction"
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
