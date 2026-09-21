import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import { forgotPasswordRequest, resetPasswordRequest } from '../api/auth';

export default function Login() {
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Forgot password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotNotice, setForgotNotice] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    const ok = await login(email, password);
    if (ok) {
      navigate('/');
    }
  }

  function handleOpenForgot() {
    setIsForgotMode(true);
    setForgotStep(1);
    setForgotEmail(email);
    setForgotError('');
    setForgotNotice('');
    setError('');
    setLoginSuccessMsg('');
  }

  function handleBackToLogin() {
    setIsForgotMode(false);
    setForgotStep(1);
    setForgotError('');
    setForgotNotice('');
    setError('');
  }

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your email address');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotNotice('');

    try {
      const res = await forgotPasswordRequest(forgotEmail.trim().toLowerCase());
      if (res.resetCode) {
        setGeneratedCode(res.resetCode);
        setResetCode(res.resetCode);
      }
      setForgotStep(2);
      setForgotNotice(res.message || 'Verification code generated successfully.');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Could not verify this email address. Please check and try again.');
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetCode || !newPassword || !confirmPassword) {
      setForgotError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await resetPasswordRequest(forgotEmail.trim().toLowerCase(), resetCode.trim(), newPassword);
      setLoginSuccessMsg(res.message || 'Password reset successfully! You can now log in.');
      setEmail(forgotEmail);
      setPassword('');
      setIsForgotMode(false);
      setForgotStep(1);
      setNewPassword('');
      setConfirmPassword('');
      setResetCode('');
      setGeneratedCode('');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Failed to reset password. Please verify the code.');
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div id="login-auth-shell" className="auth-shell">
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

          {!isForgotMode ? (
            /* Login Form Mode */
            <>
              <h2>Welcome back</h2>
              <div className="sub">Log in to your workspace to pick up where you left off.</div>

              {loginSuccessMsg && <div className="form-success">{loginSuccessMsg}</div>}
              {error && <div className="form-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label htmlFor="login-password" style={{ margin: 0 }}>Password</label>
                    <button
                      type="button"
                      id="login-forgot-password-link"
                      onClick={handleOpenForgot}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--amber)',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 500,
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  id="login-submit-btn"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Logging in…' : 'Log in'}
                </button>
              </form>

              <div className="auth-switch">
                Don't have an account? <Link to="/register" id="link-to-register">Create one</Link>
              </div>
            </>
          ) : (
            /* Forgot Password Mode */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--amber-dim)',
                  color: 'var(--amber)',
                  fontSize: '14px'
                }}>
                  🔑
                </span>
                <h2 style={{ margin: 0, fontSize: '1.45rem' }}>Reset Password</h2>
              </div>
              <div className="sub">
                {forgotStep === 1
                  ? 'Enter your registered email address to receive a secure password reset code.'
                  : `Enter the 6-digit code sent to ${forgotEmail} to set a new password.`}
              </div>

              {forgotNotice && <div className="form-success">{forgotNotice}</div>}
              {forgotError && <div className="form-error">{forgotError}</div>}

              {forgotStep === 1 ? (
                /* Step 1: Request code */
                <form onSubmit={handleRequestCode}>
                  <div className="field">
                    <label htmlFor="forgot-email">Account Email</label>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. 310625104024@eec.srmrmp.edu.in"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    id="forgot-send-code-btn"
                    className="btn-primary"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Sending verification code…' : 'Send Verification Code'}
                  </button>
                </form>
              ) : (
                /* Step 2: Enter code & new password */
                <form onSubmit={handleResetPassword}>
                  {generatedCode && (
                    <div style={{
                      padding: '10px 12px',
                      background: 'var(--ink-900)',
                      border: '1px solid var(--amber)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px'
                    }}>
                      <div>
                        <div style={{ color: 'var(--ink-300)', fontSize: '11px' }}>DEMO VERIFICATION CODE</div>
                        <div style={{ fontWeight: 700, letterSpacing: '0.15em', fontSize: '16px', color: 'var(--amber)' }}>
                          {generatedCode}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResetCode(generatedCode)}
                        style={{
                          background: 'var(--ink-800)',
                          border: '1px solid var(--ink-700)',
                          color: 'var(--paper)',
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Auto-fill Code
                      </button>
                    </div>
                  )}

                  <div className="field">
                    <label htmlFor="forgot-reset-code">6-Digit Verification Code</label>
                    <input
                      id="forgot-reset-code"
                      type="text"
                      required
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="e.g. 123456"
                      style={{ letterSpacing: '0.12em', fontWeight: 600 }}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="forgot-new-password">New Password</label>
                    <input
                      id="forgot-new-password"
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="forgot-confirm-password">Confirm New Password</label>
                    <input
                      id="forgot-confirm-password"
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button
                    type="submit"
                    id="forgot-submit-btn"
                    className="btn-primary"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Updating password…' : 'Reset Password'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={handleRequestCode}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--ink-400)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Didn't get the code? Resend
                    </button>
                  </div>
                </form>
              )}

              <div className="auth-switch" style={{ marginTop: '18px' }}>
                <button
                  type="button"
                  id="forgot-back-to-login"
                  onClick={handleBackToLogin}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  ← Back to log in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
