import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const { register, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    const ok = await register(fullName.trim(), email.trim(), password);
    if (ok) {
      navigate('/');
    }
  }

  return (
    <div id="register-auth-shell" className="auth-shell">
      <div className="auth-side">
        <div className="brand">TaskFlow</div>
        <div className="pitch">
          <h1>Set up your board in under a minute.</h1>
          <p>
            One account gets you authenticated access, full CRUD on your tasks, and live updates the moment anything changes.
          </p>
        </div>
        <div className="stat-row">
          <div>
            <div className="num">JWT</div>
            <div className="label">Secured auth</div>
          </div>
          <div>
            <div className="num">REST</div>
            <div className="label">API-driven</div>
          </div>
          <div>
            <div className="num">Live</div>
            <div className="label">Real-time board</div>
          </div>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>

        <div className="auth-card">
          <div className="mobile-brand">TaskFlow</div>
          <h2>Create your account</h2>
          <div className="sub">Start tracking work in a couple of clicks.</div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="reg-name">Full name</label>
              <input
                id="reg-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Anand Sagai David"
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              id="register-submit-btn"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account? <Link to="/login" id="link-to-login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
