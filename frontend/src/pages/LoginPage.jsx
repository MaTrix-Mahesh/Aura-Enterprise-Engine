import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAdmin, isClient } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const redirectUser = (userRole) => {
    const from = location.state?.from?.pathname;
    if (from && from !== '/login' && from !== '/403') {
      navigate(from, { replace: true });
      return;
    }
    if (userRole === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/client/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await login(email, password);
      redirectUser(user.role);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
    setSubmitting(true);

    try {
      const user = await login(demoEmail, demoPassword);
      redirectUser(user.role);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#0D9488',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
            }}
          >
            <ShieldCheck size={26} strokeWidth={2.3} />
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              margin: '0 0 6px',
            }}
          >
            VaultPay Financial Core
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Nexus Corporate Services • Zero-Trust Financial Gateway
          </p>
        </div>

        {/* Login Card */}
        <div
          className="card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.06)',
          }}
        >
          {error && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#DC2626',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Work Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="#94A3B8"
                  style={{ position: 'absolute', left: '14px', top: '14px' }}
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px 0 40px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    color: '#0F172A',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="#94A3B8"
                  style={{ position: 'absolute', left: '14px', top: '14px' }}
                />
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px 0 40px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    color: '#0F172A',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                height: '46px',
                backgroundColor: '#0D9488',
                color: '#FFFFFF',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.75 : 1,
                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
                marginTop: '4px',
              }}
            >
              {submitting ? (
                <>
                  <div
                    className="spinner"
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #FFFFFF',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to VaultPay</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo Persona Quick-Select */}
          <div style={{ marginTop: '28px', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '10px',
                textAlign: 'center',
              }}
            >
              One-Click Demo Personas (Evaluation)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@vaultpay.io', 'AdminPass123!')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#0F766E',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.15s ease',
                }}
              >
                <span>🔑 Admin (Chief Financial Officer)</span>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 400 }}>admin@vaultpay.io</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('clienta@enterprise.com', 'ClientPass123!')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#2563EB',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>🏢 Client A (Apex Global Logistics)</span>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 400 }}>clienta@enterprise.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('clientb@enterprise.com', 'ClientPass123!')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#7C3AED',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>🏢 Client B (Nordic Retail Group)</span>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 400 }}>clientb@enterprise.com</span>
              </button>
            </div>
          </div>
        </div>

        {/* Back to Catalog */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            ← Access Sprint 18 Catalog & Live Ops Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
