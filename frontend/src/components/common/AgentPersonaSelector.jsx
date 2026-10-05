import React, { useState } from 'react';
import { AVAILABLE_AGENTS, setStoredAgent } from '../../services/socket';
import { UserCheck, ChevronDown } from 'lucide-react';

/**
 * AgentPersonaSelector Component
 * Allows instant agent persona switching in the top bar to enable seamless
 * dual-window and multi-agent concurrency collision testing.
 */
export default function AgentPersonaSelector({ activeAgent, onAgentChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (agent) => {
    setStoredAgent(agent);
    if (onAgentChange) {
      onAgentChange(agent);
    }
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="agent-persona-selector"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '6px 14px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
        title="Switch active agent persona for dual-window concurrency testing"
      >
        <div
          className="agent-avatar-circle"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: activeAgent.color || '#0D9488',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          {activeAgent.avatar || 'SC'}
        </div>
        <div className="agent-persona-info" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.25 }}>
          <span className="agent-persona-name" style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
            {activeAgent.agentName}
          </span>
          <span className="agent-persona-role" style={{ fontSize: '11px', color: '#64748B' }}>
            {activeAgent.role}
          </span>
        </div>
        <ChevronDown size={14} color="#94A3B8" style={{ marginLeft: '4px' }} />
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '280px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
              zIndex: 101,
              padding: '8px',
            }}
          >
            <div
              style={{
                padding: '8px 12px 6px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderBottom: '1px solid #F1F5F9',
                marginBottom: '6px',
              }}
            >
              Select Agent Persona (Dual-Window Test)
            </div>

            {AVAILABLE_AGENTS.map((agent) => {
              const isSelected = agent.agentId === activeAgent.agentId;
              return (
                <button
                  key={agent.agentId}
                  type="button"
                  onClick={() => handleSelect(agent)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isSelected ? '#F0FDFA' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div
                    className="agent-avatar-circle"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: agent.color,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {agent.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isSelected ? '#0F766E' : '#0F172A',
                      }}
                    >
                      {agent.agentName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      {agent.role}
                    </div>
                  </div>
                  {isSelected && <UserCheck size={16} color="#0D9488" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
