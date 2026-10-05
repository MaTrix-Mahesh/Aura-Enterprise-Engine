import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

/**
 * ConnectionBanner Component
 * Shows an unmissable top warning banner whenever the Socket.io connection is dropped,
 * and a temporary confirmation toast when connection is restored.
 */
export default function ConnectionBanner({ connectionStatus = 'connected' }) {
  const [showRestored, setShowRestored] = useState(false);
  const [prevStatus, setPrevStatus] = useState(connectionStatus);

  useEffect(() => {
    if ((prevStatus === 'disconnected' || prevStatus === 'reconnecting') && connectionStatus === 'connected') {
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    }
    setPrevStatus(connectionStatus);
  }, [connectionStatus, prevStatus]);

  if (connectionStatus === 'disconnected' || connectionStatus === 'reconnecting') {
    return (
      <div className="connection-lost-banner" role="alert" aria-live="assertive">
        <RefreshCw size={16} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
        <span>Connection Lost: Reconnecting...</span>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div className="connection-restored-toast" role="status">
        <CheckCircle2 size={16} />
        <span>Connection Restored: Real-time locking active</span>
      </div>
    );
  }

  return null;
}
