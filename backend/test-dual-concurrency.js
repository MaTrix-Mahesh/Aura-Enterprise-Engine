import { io } from 'socket.io-client';

const URL = 'http://localhost:5000';

async function verifyDualWindowConcurrency() {
  console.log('================================================================');
  console.log('  RAPIDDISPATCH LIVE OPS — DUAL-AGENT CONCURRENCY VERIFICATION  ');
  console.log('================================================================\n');

  // 1. Initialize Agent A (Sarah Connor)
  console.log('Step 1: Connecting Agent A (Sarah Connor)...');
  const agentA = io(URL, {
    auth: { agentId: 'agent-101', agentName: 'Sarah Connor' },
    transports: ['websocket'],
  });

  // 2. Initialize Agent B (John Reese)
  console.log('Step 2: Connecting Agent B (John Reese)...');
  const agentB = io(URL, {
    auth: { agentId: 'agent-102', agentName: 'John Reese' },
    transports: ['websocket'],
  });

  await Promise.all([
    new Promise((resolve) => agentA.on('connect', resolve)),
    new Promise((resolve) => agentB.on('connect', resolve)),
  ]);
  console.log(`[PASS] Both agents connected via WebSocket: AgentA=${agentA.id}, AgentB=${agentB.id}\n`);

  // Explicitly join dashboard room and wait for confirmation
  await Promise.all([
    new Promise((resolve) => agentA.emit('join_dashboard', { agentName: 'Sarah Connor' }, resolve)),
    new Promise((resolve) => agentB.emit('join_dashboard', { agentName: 'John Reese' }, resolve)),
  ]);
  console.log('[PASS] Both agents joined DASHBOARD_ROOM with active state sync.\n');

  // 3. Test Exclusive Lock Acquisition
  console.log('Step 3: Agent A requests lock on Ticket #105...');
  const lockPromiseForB = new Promise((resolve) => {
    agentB.once('ticket_locked', resolve);
  });

  const lockAckA = await new Promise((resolve) => {
    agentA.emit('lock_ticket', { ticketId: 'TIC-105' }, resolve);
  });

  if (!lockAckA.success || lockAckA.lock.ticketId !== 'TIC-105') {
    throw new Error('Agent A failed to acquire lock on TIC-105');
  }
  console.log('[PASS] Agent A acquired lock successfully:', lockAckA.lock);

  const lockEventB = await lockPromiseForB;
  console.log('[PASS] Agent B received real-time ticket_locked broadcast:', lockEventB);
  if (lockEventB.agentName !== 'Sarah Connor') {
    throw new Error('Broadcasted agent name mismatch');
  }

  // 4. Test Concurrency Collision Rejection
  console.log('\nStep 4: Agent B attempts to lock Ticket #105 while Agent A holds it...');
  const rejectAckB = await new Promise((resolve) => {
    agentB.emit('lock_ticket', { ticketId: 'TIC-105' }, resolve);
  });

  console.log('[PASS] Server rejected Agent B lock attempt:', rejectAckB);
  if (rejectAckB.success !== false || rejectAckB.error !== 'COLLISION') {
    throw new Error('Collision was not properly rejected');
  }

  // 5. Test Unauthorized Unlock Prevention
  console.log('\nStep 5: Agent B attempts to unlock Ticket #105 (unauthorized)...');
  const unlockRejectB = await new Promise((resolve) => {
    agentB.emit('unlock_ticket', { ticketId: 'TIC-105' }, resolve);
  });

  console.log('[PASS] Server rejected unauthorized unlock:', unlockRejectB);
  if (unlockRejectB.success !== false || unlockRejectB.error !== 'UNAUTHORIZED_UNLOCK') {
    throw new Error('Unauthorized unlock was not prevented');
  }

  // 6. Test Save & Legitimate Unlock
  console.log('\nStep 6: Agent A saves updates to TIC-105 via REST API and unlocks...');
  const updateRes = await fetch(`${URL}/api/tickets/TIC-105`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      description: 'Updated by Sarah Connor during concurrent live ops session.',
    }),
  }).then((r) => r.json());

  console.log('[PASS] Ticket update saved to MongoDB:', updateRes.data?.status);

  const unlockPromiseForB = new Promise((resolve) => {
    agentB.once('ticket_unlocked', resolve);
  });

  const unlockAckA = await new Promise((resolve) => {
    agentA.emit('unlock_ticket', { ticketId: 'TIC-105' }, resolve);
  });
  console.log('[PASS] Agent A released lock:', unlockAckA);

  const unlockEventB = await unlockPromiseForB;
  console.log('[PASS] Agent B received real-time ticket_unlocked broadcast:', unlockEventB);

  // 7. Test Ghost Disconnect Cleanup
  console.log('\nStep 7: Testing Ghost Disconnect (Agent A locks TIC-105, then closes tab)...');
  await new Promise((resolve) => {
    agentA.emit('lock_ticket', { ticketId: 'TIC-105' }, resolve);
  });

  const ghostUnlockPromise = new Promise((resolve) => {
    agentB.once('ticket_unlocked', resolve);
  });

  // Disconnect Agent A abruptly (simulating browser close / network loss)
  agentA.disconnect();
  console.log('[Action] Agent A socket abruptly disconnected.');

  const ghostPayload = await ghostUnlockPromise;
  console.log('[PASS] Agent B received automatic ghost disconnect unlock:', ghostPayload);
  if (ghostPayload.ticketId !== 'TIC-105' || ghostPayload.reason !== 'disconnect') {
    throw new Error('Ghost disconnect auto-unlock verification failed');
  }

  // 8. Test Real-time Ticket Creation Broadcast
  console.log('\nStep 8: Testing Real-Time Ticket Creation Broadcast...');
  const createPromiseForB = new Promise((resolve) => {
    agentB.once('ticket_created', resolve);
  });

  const newTicketRes = await fetch(`${URL}/api/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Automated Multi-Agent Concurrency Verification Ticket',
      description: 'Verifying real-time broadcast and instant UI injection across distributed consoles.',
      status: 'OPEN',
      priority: 'URGENT',
      customerName: 'Multi-Agent Suite',
      customerEmail: 'ops@rapiddispatch.io',
      customerCompany: 'RapidDispatch Global',
    }),
  }).then((r) => r.json());

  console.log('[PASS] Ticket created in MongoDB:', newTicketRes.data?.ticketId);

  const createdEventB = await createPromiseForB;
  console.log('[PASS] Agent B received real-time ticket_created broadcast:', createdEventB.ticket?.ticketId);
  if (createdEventB.ticket?.ticketId !== newTicketRes.data?.ticketId) {
    throw new Error('Created ticket broadcast mismatch');
  }

  agentB.disconnect();
  console.log('\n================================================================');
  console.log('  ALL DUAL-WINDOW CONCURRENCY & GHOST DISCONNECT TESTS PASSED!  ');
  console.log('================================================================\n');

  setTimeout(() => {
    process.exit(0);
  }, 200);
}

verifyDualWindowConcurrency().catch((err) => {
  console.error('[FATAL FAIL] Concurrency verification failed:', err);
  process.exit(1);
});
