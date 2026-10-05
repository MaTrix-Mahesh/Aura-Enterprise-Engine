import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, getStoredAgent } from '../services/socket';

/**
 * useLiveOpsSocket Hook
 * Provides reactive access to the real-time Socket.io stream,
 * active distributed lock state, connection status, and event handlers.
 * Built with full React Strict Mode lifecycle resilience.
 *
 * @param {object} options
 * @param {Function} [options.onTicketCreated] - Callback when a new ticket is pushed
 * @param {Function} [options.onLockRejected] - Callback when a lock collision occurs
 * @returns {object} Live Ops state and mutation methods
 */
export function useLiveOpsSocket({ onTicketCreated, onLockRejected } = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'disconnected' | 'reconnecting'
  const [locks, setLocks] = useState({}); // { [ticketId]: LockDescriptor }
  const [activeAgent, setActiveAgent] = useState(getStoredAgent());
  const [notification, setNotification] = useState(null);

  // References to keep latest callbacks without triggering re-subscriptions
  const onTicketCreatedRef = useRef(onTicketCreated);
  const onLockRejectedRef = useRef(onLockRejected);

  useEffect(() => {
    onTicketCreatedRef.current = onTicketCreated;
  }, [onTicketCreated]);

  useEffect(() => {
    onLockRejectedRef.current = onLockRejected;
  }, [onLockRejected]);

  useEffect(() => {
    const socket = getSocket(activeAgent);

    // Initial connection state check
    if (socket.connected) {
      setIsConnected(true);
      setConnectionStatus('connected');
    }

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      socket.emit('join_dashboard', activeAgent);
    };

    const handleDisconnect = (reason) => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      console.warn('[LiveOps] Socket disconnected:', reason);
    };

    const handleReconnectAttempt = () => {
      setConnectionStatus('reconnecting');
    };

    const handleCurrentLocks = (data) => {
      if (data && Array.isArray(data.locks)) {
        const lockMap = {};
        data.locks.forEach((lock) => {
          lockMap[lock.ticketId] = lock;
        });
        setLocks(lockMap);
      }
    };

    const handleTicketLocked = (lock) => {
      if (lock && lock.ticketId) {
        setLocks((prev) => ({
          ...prev,
          [lock.ticketId]: lock,
        }));
      }
    };

    const handleTicketUnlocked = ({ ticketId }) => {
      if (ticketId) {
        setLocks((prev) => {
          const next = { ...prev };
          delete next[ticketId];
          return next;
        });
      }
    };

    const handleLockRejected = (data) => {
      console.warn('[LiveOps] Lock rejected:', data);
      setNotification({
        type: 'danger',
        message: data.message || 'Ticket lock request was rejected',
        timestamp: Date.now(),
      });
      if (onLockRejectedRef.current) {
        onLockRejectedRef.current(data);
      }
    };

    const handleTicketCreated = (data) => {
      if (data && data.ticket) {
        if (onTicketCreatedRef.current) {
          onTicketCreatedRef.current(data.ticket);
        }
      }
    };

    // Bind event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io?.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('current_locks', handleCurrentLocks);
    socket.on('ticket_locked', handleTicketLocked);
    socket.on('ticket_unlocked', handleTicketUnlocked);
    socket.on('lock_rejected', handleLockRejected);
    socket.on('ticket_created', handleTicketCreated);

    // React Strict Mode Teardown: Cleanly unsubscribe listeners
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io?.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('current_locks', handleCurrentLocks);
      socket.off('ticket_locked', handleTicketLocked);
      socket.off('ticket_unlocked', handleTicketUnlocked);
      socket.off('lock_rejected', handleLockRejected);
      socket.off('ticket_created', handleTicketCreated);
    };
  }, [activeAgent]);

  // Lock Request Helper
  const acquireLock = useCallback(
    (ticketId) => {
      const socket = getSocket(activeAgent);
      return new Promise((resolve) => {
        if (!socket.connected) {
          resolve({ success: false, error: 'OFFLINE', message: 'Socket offline' });
          return;
        }

        socket.emit('lock_ticket', { ticketId, agent: activeAgent }, (res) => {
          resolve(res || { success: true, ticketId });
        });
      });
    },
    [activeAgent]
  );

  // Unlock Helper
  const releaseLock = useCallback((ticketId) => {
    const socket = getSocket();
    return new Promise((resolve) => {
      if (!socket.connected) {
        resolve({ success: true, ticketId });
        return;
      }

      socket.emit('unlock_ticket', { ticketId }, (res) => {
        resolve(res || { success: true, ticketId });
      });
    });
  }, []);

  return {
    isConnected,
    connectionStatus,
    locks,
    activeAgent,
    setActiveAgent,
    acquireLock,
    releaseLock,
    notification,
    clearNotification: () => setNotification(null),
  };
}

export default useLiveOpsSocket;
