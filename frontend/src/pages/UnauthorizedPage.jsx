import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Boxes } from 'lucide-react';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isClient } = useAuth();

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          border: '1px solid #FECACA',
          borderRadius: '16px',
          padding: '40px 36px',
          boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.08), 0 8px 10px -6px rgba(239, 68, 68, 0.04)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            border: '2px solid #FCA5A5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#DC2626',
          }}
        >
          <ShieldAlert size={34} strokeWidth={2.2} />
        </div>

        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FECACA',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '3px 12px',
            borderRadius: '9999px',
            marginBottom: '12px',
          }}
        >
          HTTP 403 Forbidden
        </div>

        <h1
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            margin: '0 0 10px',
          }}
        >
          Access Denied: Unauthorized Route
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: '#64748B',
            lineHeight: 1.6,
            margin: '0 0 24px',
          }}
        >
          You do not have the required permissions to access this administrative resource.
          {user?.role && (
            <span>
              {' '}Your authenticated role is <strong style={{ color: '#0F172A' }}>{user.role}</strong>, which does not permit administrative console privileges.
            </span>
          )}
        </p>

        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '12px',
            color: '#475569',
            textAlign: 'left',
            marginBottom: '28px',
          }}
        >
          <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>
            🔒 Zero-Trust Enforcement Notice:
          </div>
          All route attempts are monitored. RBAC policies strictly isolate Client tenants from Admin management APIs and administrative dashboards.
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {isClient && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/client/dashboard')}
              style={{
                height: '44px',
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
                cursor: 'pointer',
              }}
            >
              <LayoutDashboard size={16} />
              <span>Go to Client Billing Dashboard</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/admin/dashboard')}
              style={{
                height: '44px',
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
                cursor: 'pointer',
              }}
            >
              <LayoutDashboard size={16} />
              <span>Go to Admin Dashboard</span>
            </button>
          )}

          <button
            type="button"
            className="btn"
            onClick={() => navigate('/inventory')}
            style={{
              height: '44px',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              fontWeight: 500,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <Boxes size={16} color="#64748B" />
            <span>Return to Catalog Inventory</span>
          </button>
        </div>
      </div>
    </div>
  );
}
