import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const features = [
  {
    label: 'TASKS',
    title: 'Plan the day',
    text: 'Write daily tasks, finish them one by one, and keep every day organized.',
  },
  {
    label: 'TIMER',
    title: 'Track focused work',
    text: 'Start a session, stop when done, and let ProgressBook calculate your time.',
  },
  {
    label: 'MONEY',
    title: 'Know the flow',
    text: 'Record income and expenses with category, payment method, and notes.',
  },
  {
    label: 'STATS',
    title: 'See the pattern',
    text: 'Understand work hours, spending categories, and monthly income vs expense.',
  },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <main className="landing-page">
      <section className="landing-hero" aria-label="ProgressBook landing page">
        <div className="landing-hero__grain" />
        <div className="landing-hero__backtype" aria-hidden="true">
          PROGRESS
          <br />
          BOOK
          <br />
          PROGRESS
        </div>

        <header className="landing-nav">
          <Link to="/" className="landing-brand">
            <span className="landing-brand__mark">
              <img src="/brand-logo.png" alt="" />
            </span>
            <span>PROGRESSBOOK</span>
          </Link>
          <Link to={user ? '/todos' : '/login'} className="landing-nav__link">
            {user ? 'OPEN APP' : 'SIGN IN'}
          </Link>
        </header>

        <div className="landing-copy landing-copy--left">
          Track your day without making your day complicated.
        </div>
        <div className="landing-copy landing-copy--right">
          Tasks, time and money in one clean personal system.
        </div>

        <div className="landing-kicker">PERSONAL DAILY TRACKER</div>
        <h1 className="landing-title">
          PROGRESS
          <span>BOOK</span>
        </h1>

        <div className="landing-strip" aria-hidden="true">
          <span>TO-DO</span>
          <span />
          <span>WORK TIME</span>
          <span />
          <span>INCOME EXPENSE</span>
        </div>

        <div className="landing-person" aria-hidden="true">
          <img src="/person-cutout.png" alt="" />
        </div>

        <div className="landing-card landing-card--one">
          <span>01</span>
          Tasks stay visible until they are complete.
        </div>
        <div className="landing-card landing-card--two">
          <span>02</span>
          Timer sessions survive refreshes.
        </div>

        <div className="landing-actions">
          <Link to={user ? '/todos' : '/login'} className="landing-cta">
            {user ? 'Open dashboard' : 'Start with Google'}
          </Link>
          <a href="#features" className="landing-secondary">
            See features
          </a>
        </div>
      </section>

      <section id="features" className="landing-features">
        <div className="landing-section-label">WHY IT EXISTS</div>
        <h2>One place for the small things that quietly decide your day.</h2>
        <p>
          ProgressBook is for simple daily tracking. You sign in with Google, and your records stay separated from everyone else while the app stores data in one Google Sheet.
        </p>

        <div className="landing-feature-grid">
          {features.map((feature) => (
            <article key={feature.label} className="landing-feature">
              <div className="landing-feature__label">{feature.label}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
