import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TicketCard from './TicketCard';
import EditTicketModal from './EditTicketModal';
import CreateTicketModal from './CreateTicketModal';
import ConnectionBanner from '../common/ConnectionBanner';
import { api } from '../../services/api';
import { useLiveOpsSocket } from '../../hooks/useLiveOpsSocket';
import {
  Search,
  Plus,
  RefreshCw,
  Lock,
  FileText,
  Clock,
  AlertTriangle,
  Radio,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

/**
 * TicketBoard Component
 * Primary workspace for RapidDispatch Live Ops (Sprint 19).
 * Features real-time Socket.io synchronized state, single-editor distributed locking,
 * dual-window collision protection, ghost disconnect resilience, and live ticket injection.
 */
export default function TicketBoard({ activeAgent, onAgentChange }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modal states
  const [editingTicket, setEditingTicket] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Trigger toast notification
  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage({ message: msg, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Real-time Socket Hook
  const {
    isConnected,
    connectionStatus,
    locks,
    acquireLock,
    releaseLock,
  } = useLiveOpsSocket({
    onTicketCreated: (newTicket) => {
      console.log('[LiveOps] Real-time new ticket received via Socket.io:', newTicket.ticketId);
      setTickets((prev) => {
        if (prev.some((t) => t.ticketId === newTicket.ticketId)) {
          return prev;
        }
        return [{ ...newTicket, _justCreated: true }, ...prev];
      });
      showToast(`⚡ New Ticket ${newTicket.ticketId} dispatched: "${newTicket.title}"`, 'success');
    },
    onLockRejected: (rejection) => {
      showToast(rejection.message || 'Editing collision: Ticket is locked by another agent', 'danger');
    },
  });

  // Fetch tickets initially from MongoDB persistent storage
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.tickets.list({
        search: searchQuery,
        status: statusFilter,
        priority: priorityFilter,
        limit: 50,
      });
      if (res && res.success && res.data) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error('[LiveOps] Fetch tickets error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Handle Edit Action with atomic lock acquisition
  const handleEditClick = async (ticket) => {
    const activeLock = locks[ticket.ticketId];

    // If locked by another agent, reject on client before emitting
    if (activeLock && activeLock.agentId !== activeAgent.agentId) {
      showToast(`Cannot edit: ${activeLock.agentName} is currently editing this ticket.`, 'danger');
      return;
    }

    // Request exclusive lock from authoritative server
    const result = await acquireLock(ticket.ticketId);

    if (result && result.success) {
      setEditingTicket(ticket);
    } else {
      showToast(
        result?.message || 'Lock acquisition rejected. Another agent just acquired this ticket.',
        'danger'
      );
    }
  };

  // Close editing modal and release lock
  const handleCloseEdit = async () => {
    if (editingTicket) {
      await releaseLock(editingTicket.ticketId);
      setEditingTicket(null);
    }
  };

  // Successful save: update local state, release lock, and close modal
  const handleSaveSuccess = async (updatedTicket) => {
    if (editingTicket) {
      await releaseLock(editingTicket.ticketId);
      setTickets((prev) =>
        prev.map((t) => (t.ticketId === updatedTicket.ticketId ? updatedTicket : t))
      );
      setEditingTicket(null);
      showToast(`✓ Ticket ${updatedTicket.ticketId} saved successfully`, 'success');
    }
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (statusFilter !== 'ALL' && ticket.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && ticket.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ticket.title?.toLowerCase().includes(q);
        const matchId = ticket.ticketId?.toLowerCase().includes(q);
        const matchCustomer = ticket.customerName?.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchCustomer) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, searchQuery]);

  // Summary Metrics
  const activeLockCount = Object.keys(locks).length;
  const urgentCount = tickets.filter((t) => t.priority === 'URGENT').length;
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;

  return (
    <div className="liveops-container" style={{ paddingBottom: '40px' }}>
      {/* 1. Connection Lost & Restored Banner */}
      <ConnectionBanner connectionStatus={connectionStatus} />

      {/* 2. Toast Notifications */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '84px',
            right: '28px',
            zIndex: 9999,
            backgroundColor: toastMessage.type === 'danger' ? '#EF4444' : '#0F766E',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
            animation: 'slideDown 0.25s ease-out',
          }}
        >
          {toastMessage.type === 'danger' ? <AlertTriangle size={16} /> : <Radio size={16} />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* 3. Hero / Page Header Banner (Matching Reference Design) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #F0FDFA 100%)',
          border: '1px solid #D1FAE5',
          borderRadius: '16px',
          padding: '24px 30px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
          boxShadow: '0 1px 3px rgba(16, 185, 129, 0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left Side: Icon + Titles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.12)',
              flexShrink: 0,
            }}
          >
            <Radio size={26} strokeWidth={2.4} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '30px',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: '#0F172A',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              <span style={{ color: '#0F766E', marginRight: '8px' }}>RapidDispatch</span>
              Live Ops
            </h1>
            <p
              style={{
                fontSize: '15px',
                color: '#475569',
                marginTop: '6px',
                margin: '6px 0 0 0',
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              Real-time collaborative support-ticket system with distributed lock manager & collision prevention.
            </p>
          </div>
        </div>

        {/* Right Side: Dispatch Fleet Badge & Illustration */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          {/* Stylized SVG Truck & Pin Graphic */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              position: 'relative',
            }}
          >
            {/* Location Pin */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(239, 68, 68, 0.3)',
                animation: 'bounce 2.5s infinite ease-in-out',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>

            {/* Modern Clean SVG Dispatch Vehicle */}
            <svg width="150" height="60" viewBox="0 0 160 64" fill="none">
              {/* Skyline Background Silhouette */}
              <path d="M10 52V38h12v14M22 52V28h16v24M38 52V34h12v18" stroke="#A7F3D0" strokeWidth="1.5" strokeOpacity="0.6" />
              {/* Truck Trailer */}
              <rect x="52" y="16" width="70" height="34" rx="4" fill="#0D9488" />
              <rect x="56" y="20" width="62" height="26" rx="2" fill="#0F766E" />
              {/* Truck Cabin */}
              <path d="M122 28h16l10 10v12h-26V28z" fill="#14B8A6" />
              <path d="M126 31h10l6 7h-16v-7z" fill="#CCFBF1" />
              {/* Wheels */}
              <circle cx="68" cy="50" r="7" fill="#1E293B" />
              <circle cx="68" cy="50" r="3" fill="#94A3B8" />
              <circle cx="82" cy="50" r="7" fill="#1E293B" />
              <circle cx="82" cy="50" r="3" fill="#94A3B8" />
              <circle cx="138" cy="50" r="7" fill="#1E293B" />
              <circle cx="138" cy="50" r="3" fill="#94A3B8" />
              {/* Road Line */}
              <line x1="10" y1="57" x2="155" y2="57" stroke="#A7F3D0" strokeWidth="2" strokeDasharray="6 4" />
            </svg>
          </div>

          {/* Badge: Keeping Freight Moving 24/7 */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #A7F3D0',
              borderRadius: '12px',
              padding: '10px 18px',
              textAlign: 'right',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)',
              lineHeight: 1.25,
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#065F46' }}>Keeping</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#065F46' }}>Freight Moving</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0D9488' }}>24/7</div>
          </div>
        </div>
      </div>

      {/* 4. Live Ops Metric Cards (4 Cards with Spacing & Sparklines) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Card 1: Active Distributed Locks */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
                flexShrink: 0,
              }}
            >
              <Lock size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                Active Distributed Locks
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, margin: '4px 0 2px' }}>
                {activeLockCount}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                {activeLockCount === 1 ? 'ticket locked' : 'tickets locked'}
              </div>
            </div>
          </div>
          {/* Sparkline Decorative Wave */}
          <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
            <path d="M2 24C10 24 12 14 20 14C28 14 30 6 46 4" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 2: Total Tickets in Queue */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
                flexShrink: 0,
              }}
            >
              <FileText size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#2563EB' }}>
                Total Tickets in Queue
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, margin: '4px 0 2px' }}>
                {tickets.length}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                synced from MongoDB
              </div>
            </div>
          </div>
          {/* Sparkline Decorative Bars */}
          <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
            <rect x="2" y="16" width="6" height="10" rx="2" fill="#93C5FD" />
            <rect x="12" y="12" width="6" height="14" rx="2" fill="#60A5FA" />
            <rect x="22" y="8" width="6" height="18" rx="2" fill="#3B82F6" />
            <rect x="32" y="4" width="6" height="22" rx="2" fill="#2563EB" />
          </svg>
        </div>

        {/* Card 3: Open Incidents */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#FFF7ED',
                border: '1px solid #FED7AA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EA580C',
                flexShrink: 0,
              }}
            >
              <Clock size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#EA580C' }}>
                Open Incidents
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, margin: '4px 0 2px' }}>
                {openCount}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                requiring triage
              </div>
            </div>
          </div>
          {/* Sparkline Decorative Wave */}
          <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
            <path d="M2 18C12 24 16 8 26 14C36 20 40 4 46 8" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Card 4: Urgent Priority */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#DC2626' }}>
                Urgent Priority
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, margin: '4px 0 2px' }}>
                {urgentCount}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                SLA critical
              </div>
            </div>
          </div>
          {/* Sparkline Decorative Bars */}
          <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
            <rect x="2" y="18" width="6" height="8" rx="2" fill="#FCA5A5" />
            <rect x="12" y="14" width="6" height="12" rx="2" fill="#F87171" />
            <rect x="22" y="10" width="6" height="16" rx="2" fill="#EF4444" />
            <rect x="32" y="4" width="6" height="22" rx="2" fill="#DC2626" />
          </svg>
        </div>
      </div>

      {/* 5. Spacious Search & Filter Bar (Matching Reference Design) */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '16px 22px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Left Side: Search + Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '340px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '380px' }}>
            <Search
              size={16}
              color="#94A3B8"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              type="text"
              style={{
                height: '44px',
                paddingLeft: '40px',
                paddingRight: '14px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                fontSize: '14px',
                color: '#1E293B',
                width: '100%',
                outline: 'none',
                transition: 'border 0.15s ease',
              }}
              placeholder="Search by ticket ID, title, customer, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              style={{
                height: '44px',
                padding: '0 36px 0 16px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
              }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING">Waiting</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <ChevronDown
              size={14}
              color="#64748B"
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Priority Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              style={{
                height: '44px',
                padding: '0 36px 0 16px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
              }}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <ChevronDown
              size={14}
              color="#64748B"
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Right Side: Socket.io Live Status + New Ticket Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Socket.io Live Indicator */}
          <div
            style={{
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#059669',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                display: 'inline-block',
                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
              }}
            />
            <span>Socket.io Live</span>
          </div>

          {/* New Ticket Button */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              backgroundColor: '#0D9488',
              color: '#FFFFFF',
              height: '44px',
              padding: '0 22px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0F766E')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0D9488')}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* 6. Spacious 3-Column Ticket Cards Grid (Gap 24px) */}
      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#64748B' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 14px' }} />
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Synchronizing Live Ops tickets...</div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px dashed #CBD5E1',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
          }}
        >
          <SlidersHorizontal size={32} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>
            No tickets match your filter criteria
          </h4>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
            Adjust your search query or create a new incident ticket.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.ticketId || ticket._id}
              ticket={ticket}
              lock={locks[ticket.ticketId]}
              activeAgent={activeAgent}
              onEdit={handleEditClick}
              onUnlock={(t) => releaseLock(t.ticketId)}
              isJustCreated={ticket._justCreated}
            />
          ))}
        </div>
      )}

      {/* 7. Edit Ticket Modal (Lock Owner) */}
      <EditTicketModal
        isOpen={Boolean(editingTicket)}
        ticket={editingTicket}
        activeAgent={activeAgent}
        onClose={handleCloseEdit}
        onSuccess={handleSaveSuccess}
      />

      {/* 8. Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(created) => {
          showToast(`⚡ Incident Ticket ${created.ticketId} created and broadcasted`, 'success');
        }}
      />
    </div>
  );
}
