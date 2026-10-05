import { io } from 'socket.io-client';

/**
 * Socket.io Singleton Client for RapidDispatch Live Ops (Sprint 19).
 * Manages WebSocket connection lifecycle, connection state listeners,
 * agent authentication payloads, and real-time event subscriptions.
 */

// Resolves socket URL from environment or defaults to backend port 5000
const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:5000'
).replace(/\/+$/, '');

let socket = null;
let currentStatus = 'connecting';
const statusListeners = new Set();

function notifyStatus(status) {
  currentStatus = status;
  statusListeners.forEach((fn) => {
    try {
      fn(status);
    } catch (err) {
      console.error('[Socket] Status listener error:', err);
    }
  });
}

/**
 * Subscribes to real-time socket connection status changes.
 *
 * @param {(status: 'connected' | 'disconnected' | 'reconnecting' | 'connecting') => void} listener
 * @returns {() => void} Unsubscribe function
 */
export function subscribeConnectionStatus(listener) {
  statusListeners.add(listener);
  getSocket();
  listener(currentStatus);
  return () => statusListeners.delete(listener);
}

/**
 * Returns current socket connection status.
 * @returns {'connected' | 'disconnected' | 'reconnecting' | 'connecting'}
 */
export function getConnectionStatus() {
  return currentStatus;
}

/**
 * Initializes or retrieves the singleton Socket.io client instance.
 *
 * @param {{ agentId: string, agentName: string }} [agent]
 * @returns {import('socket.io-client').Socket}
 */
export function getSocket(agent) {
  if (!socket) {
    const activeAgent = agent || getStoredAgent();

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        agentId: activeAgent.agentId,
        agentName: activeAgent.agentName,
      },
    });

    socket.on('connect', () => {
      console.log(`[Socket] Connected to ${SOCKET_URL} with socket ID: ${socket.id}`);
      notifyStatus('connected');
      // Join the live ops dashboard room immediately
      socket.emit('join_dashboard', getStoredAgent());
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket] Connection error:', error.message);
      notifyStatus('reconnecting');
    });

    socket.io?.on('reconnect_attempt', () => {
      notifyStatus('reconnecting');
    });

    socket.on('reconnect', (attempt) => {
      console.log(`[Socket] Reconnected after ${attempt} attempts. Re-joining dashboard...`);
      notifyStatus('connected');
      socket.emit('join_dashboard', getStoredAgent());
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from server:', reason);
      notifyStatus('disconnected');
    });
  }

  return socket;
}

/**
 * Updates agent identity on the active socket connection.
 *
 * @param {{ agentId: string, agentName: string }} agent
 */
export function updateSocketAgent(agent) {
  if (socket && agent) {
    socket.auth = {
      agentId: agent.agentId,
      agentName: agent.agentName,
    };
    if (socket.connected) {
      socket.emit('join_dashboard', agent);
    }
  }
}

/**
 * Helper to emit a lock request with a promise-based response.
 *
 * @param {string} ticketId
 * @param {{ agentId: string, agentName: string }} agent
 * @returns {Promise<{ success: boolean, lock?: object, error?: string, message?: string }>}
 */
export function requestTicketLock(ticketId, agent) {
  const s = getSocket();
  return new Promise((resolve) => {
    if (!s.connected) {
      resolve({ success: false, error: 'DISCONNECTED', message: 'Not connected to server' });
      return;
    }

    s.emit('lock_ticket', { ticketId, agent }, (response) => {
      if (response) {
        resolve(response);
      } else {
        // Fallback resolution in case server did not use callback ack
        resolve({ success: true, ticketId });
      }
    });
  });
}

/**
 * Helper to emit an unlock request.
 *
 * @param {string} ticketId
 * @returns {Promise<{ success: boolean, ticketId?: string, error?: string }>}
 */
export function releaseTicketLock(ticketId) {
  const s = getSocket();
  return new Promise((resolve) => {
    if (!s.connected) {
      resolve({ success: true, ticketId });
      return;
    }

    s.emit('unlock_ticket', { ticketId }, (response) => {
      if (response) {
        resolve(response);
      } else {
        resolve({ success: true, ticketId });
      }
    });
  });
}

/**
 * Default agent personas available for dual-window simulation.
 */
export const AVAILABLE_AGENTS = [
  {
    agentId: 'agent-101',
    agentName: 'Sarah Connor',
    role: 'Tier 2 Support Lead',
    avatar: 'SC',
    color: '#0D9488',
  },
  {
    agentId: 'agent-102',
    agentName: 'John Reese',
    role: 'Incident Response Specialist',
    avatar: 'JR',
    color: '#3B82F6',
  },
  {
    agentId: 'agent-103',
    agentName: 'Harold Finch',
    role: 'Systems Operations Architect',
    avatar: 'HF',
    color: '#8B5CF6',
  },
];

const AGENT_STORAGE_KEY = 'rapiddispatch_active_agent';

/**
 * Retrieves the current agent persona from localStorage, or defaults to Agent A.
 *
 * @returns {{ agentId: string, agentName: string, role: string, avatar: string, color: string }}
 */
export function getStoredAgent() {
  try {
    const raw = localStorage.getItem(AGENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.agentId) return parsed;
    }
  } catch {
    // Ignore storage parse error
  }
  return AVAILABLE_AGENTS[0];
}

/**
 * Persists the chosen agent persona and updates socket auth.
 *
 * @param {typeof AVAILABLE_AGENTS[0]} agent
 */
export function setStoredAgent(agent) {
  try {
    localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(agent));
    updateSocketAgent(agent);
  } catch {
    // Ignore storage write error
  }
}

export default {
  getSocket,
  updateSocketAgent,
  requestTicketLock,
  releaseTicketLock,
  AVAILABLE_AGENTS,
  getStoredAgent,
  setStoredAgent,
};
