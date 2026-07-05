import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
      return;
    }

    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const navItems = [
    { path: '/todos', label: 'TASKS', icon: '[ ]' },
    { path: '/tracking', label: 'TIMER', icon: '00' },
    { path: '/finance', label: 'MONEY', icon: '$' },
    { path: '/dashboard', label: 'STATS', icon: '#' },
  ];

  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__brand">PROGRESSBOOK</div>
        <div className="layout__user">
          <span className="layout__name">{user?.name || user?.email}</span>
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn--ghost layout__theme-toggle"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? 'LT' : theme === 'dark' ? 'DK' : 'SYS'}
          </button>
          <button type="button" onClick={logout} className="btn btn--ghost layout__logout">
            LOGOUT
          </button>
        </div>
      </header>

      <div className="layout__body">
        <nav className="layout__nav">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} className={`nav-item ${isActive ? 'nav-item--active' : ''}`}>
                <span className="nav-item__icon">{item.icon}</span>
                <span className="nav-item__label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
