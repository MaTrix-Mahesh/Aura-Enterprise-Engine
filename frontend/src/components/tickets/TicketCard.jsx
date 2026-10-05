import React from 'react';
import { Lock, Unlock, User, Building, Edit3, Save, X } from 'lucide-react';

/**
 * TicketCard Component
 * High-density, spacious, accessible support ticket card conforming to
 * the RapidDispatch Live Ops design specification.
 */
export default function TicketCard({
  ticket,
  lock,
  activeAgent,
  onEdit,
  onUnlock,
  isJustCreated = false,
}) {
  const isLocked = Boolean(lock);
  const isLockedByMe = isLocked && (lock.agentId === activeAgent.agentId);
  const isLockedByOther = isLocked && !isLockedByMe;

  const priority = (ticket.priority || 'MEDIUM').toUpperCase();
  const status = (ticket.status || 'OPEN').toUpperCase();

  // Clean priority colors (light backgrounds, soft saturated text)
  const priorityStyles = {
    URGENT: { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' },
    HIGH: { bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C' },
    MEDIUM: { bg: '#FFFBEB', border: '#FDE68A', color: '#B45309' },
    LOW: { bg: '#F1F5F9', border: '#E2E8F0', color: '#475569' },
  }[priority] || { bg: '#F1F5F9', border: '#E2E8F0', color: '#475569' };

  // Status badge colors
  const statusStyles = {
    OPEN: { bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB' },
    IN_PROGRESS: { bg: '#FAF5FF', border: '#E9D5FF', color: '#7E22CE' },
    WAITING: { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706' },
    RESOLVED: { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D' },
    CLOSED: { bg: '#F1F5F9', border: '#E2E8F0', color: '#64748B' },
  }[status] || { bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB' };

  return (
    <div
      className={`ticket-card ${isLockedByMe ? 'locked-by-me' : ''} ${isLockedByOther ? 'locked-by-other' : ''} ${isJustCreated ? 'just-created' : ''}`}
      id={`ticket-card-${ticket.ticketId}`}
      style={{
        backgroundColor: isLockedByOther ? '#FFFAFA' : isLockedByMe ? '#F0FDFA' : '#FFFFFF',
        border: `1px solid ${isLockedByOther ? '#FECACA' : isLockedByMe ? '#99F6E4' : '#E2E8F0'}`,
        borderRadius: '16px',
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isLockedByMe
          ? '0 0 0 2px rgba(13, 148, 136, 0.18), 0 4px 12px rgba(13, 148, 136, 0.08)'
          : '0 1px 3px rgba(0,0,0,0.03), 0 4px 8px -2px rgba(0,0,0,0.02)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}
    >
      {/* 1. Top Row: ID + Priority (Left) and Status / Lock Badge (Right) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Ticket ID Tag */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              color: '#0F766E',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '3px 8px',
              borderRadius: '6px',
              letterSpacing: '0.02em',
            }}
          >
            {ticket.ticketId}
          </span>

          {/* Priority Pill */}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: priorityStyles.bg,
              border: `1px solid ${priorityStyles.border}`,
              color: priorityStyles.color,
              padding: '3px 8px',
              borderRadius: '6px',
              letterSpacing: '0.04em',
            }}
          >
            {priority}
          </span>
        </div>

        {/* Right Tag: Lock Badge if locked by other, else Status Badge */}
        {isLockedByOther ? (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              padding: '3px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              letterSpacing: '0.04em',
            }}
            title={`Locked by ${lock.agentName}`}
          >
            <Lock size={12} strokeWidth={2.5} />
            <span>LOCKED BY {lock.agentName?.split(' ')[0]?.toUpperCase() || 'AGENT'}</span>
          </span>
        ) : (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: statusStyles.bg,
              border: `1px solid ${statusStyles.border}`,
              color: statusStyles.color,
              padding: '3px 10px',
              borderRadius: '6px',
              letterSpacing: '0.04em',
            }}
          >
            {status.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* 2. Middle Content: Title & Description */}
      <div style={{ marginTop: '14px', flex: 1 }}>
        <h4
          style={{
            fontSize: '17px',
            fontWeight: 700,
            color: '#0F172A',
            lineHeight: 1.35,
            margin: '0 0 8px 0',
          }}
        >
          {ticket.title}
        </h4>
        <p
          style={{
            fontSize: '14px',
            color: '#64748B',
            lineHeight: 1.5,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {ticket.description}
        </p>
      </div>

      {/* 3. Customer & Organization Metadata */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: '#64748B',
          marginTop: '16px',
        }}
      >
        <User size={14} color="#94A3B8" />
        <span style={{ fontWeight: 600, color: '#334155' }}>{ticket.customerName}</span>
        <span style={{ color: '#CBD5E1' }}>•</span>
        <Building size={14} color="#94A3B8" />
        <span style={{ color: '#64748B' }}>{ticket.customerCompany || 'Enterprise Client'}</span>
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: isLockedByOther ? '#FEE2E2' : '#F1F5F9',
          margin: '16px 0 14px',
        }}
      />

      {/* 4. Bottom Action Row: Lock State Indicator + Edit Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left State Indicator */}
        {isLockedByOther ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#DC2626',
            }}
          >
            <Lock size={14} />
            <span>Locked by {lock.agentName}</span>
          </div>
        ) : isLockedByMe ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#0F766E',
            }}
          >
            <Lock size={14} />
            <span>You are editing</span>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#059669',
            }}
          >
            <Unlock size={14} color="#10B981" />
            <span>Unlocked</span>
          </div>
        )}

        {/* Right Action Button(s) */}
        {isLockedByOther ? (
          <button
            type="button"
            disabled
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '36px',
              padding: '0 16px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#94A3B8',
              cursor: 'not-allowed',
            }}
            title={`Locked by ${lock.agentName}`}
          >
            <Lock size={13} />
            <span>Edit Disabled</span>
          </button>
        ) : isLockedByMe ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onEdit(ticket)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 14px',
                backgroundColor: '#0D9488',
                border: '1px solid #0D9488',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#FFFFFF',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
              }}
              title="Save changes or edit ticket"
            >
              <Save size={13} />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => onUnlock && onUnlock(ticket)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '36px',
                padding: '0 14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
              }}
              title="Close editing session and release lock"
            >
              <X size={13} />
              <span>Close</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onEdit(ticket)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '36px',
              padding: '0 18px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1E293B',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0D9488';
              e.currentTarget.style.color = '#0D9488';
              e.currentTarget.style.backgroundColor = '#F0FDFA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#CBD5E1';
              e.currentTarget.style.color = '#1E293B';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
            title="Acquire lock and edit ticket"
          >
            <Unlock size={14} color="#10B981" />
            <span>Edit</span>
          </button>
        )}
      </div>
    </div>
  );
}
