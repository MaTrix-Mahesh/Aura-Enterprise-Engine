import { io } from 'socket.io-client';

const URL = 'http://localhost:5000';

async function runTest() {
  console.log('--- Starting RapidDispatch Live Ops Socket Concurrency Test ---');

  // Client A
  const socketA = io(URL, {
    auth: { agentId: 'agent-101', agentName: 'Sarah Connor' },
    transports: ['websocket'],
  });

  // Client B
  const socketB = io(URL, {
    auth: { agentId: 'agent-102', agentName: 'John Reese' },
    transports: ['websocket'],
  });

  await Promise.all([
    new Promise((resolve) => socketA.on('connect', resolve)),
    new Promise((resolve) => socketB.on('connect', resolve)),
  ]);

  console.log(`[PASS] Both clients connected: SocketA=${socketA.id}, SocketB=${socketB.id}`);

  // Test 1: join_dashboard and receive current_locks
  const locksA = await new Promise((resolve) => {
    socketA.emit('join_dashboard', { agentName: 'Sarah Connor' });
    socketA.on('current_locks', (data) => resolve(data.locks));
  });
  console.log(`[PASS] SocketA joined dashboard, initial locks received: ${locksA.length}`);

  socketB.emit('join_dashboard', { agentName: 'John Reese' });

  // Test 2: Socket A locks TIC-105
  console.log('Test 2: Socket A requests lock on TIC-105...');
  const lockPromiseB = new Promise((resolve) => {
    socketB.once('ticket_locked', (payload) => {
      resolve(payload);
    });
  });

  const lockAckA = await new Promise((resolve) => {
    socketA.emit('lock_ticket', { ticketId: 'TIC-105' }, resolve);
  });
  console.log('[PASS] Socket A lock ack:', lockAckA);

  const broadcastToB = await lockPromiseB;
  console.log('[PASS] Socket B received broadcast ticket_locked:', broadcastToB);
  if (broadcastToB.ticketId !== 'TIC-105' || broadcastToB.agentName !== 'Sarah Connor') {
    throw new Error('Lock broadcast payload mismatch');
  }

  // Test 3: Socket B attempts duplicate lock on TIC-105 -> must be REJECTED
  console.log('Test 3: Socket B requests duplicate lock on TIC-105 (collision test)...');
  const rejectAckB = await new Promise((resolve) => {
    socketB.emit('lock_ticket', { ticketId: 'TIC-105' }, resolve);
  });
  console.log('[PASS] Socket B duplicate lock result:', rejectAckB);
  if (rejectAckB.success !== false || rejectAckB.error !== 'COLLISION') {
    throw new Error('Duplicate lock was not properly rejected');
  }

  // Test 4: Socket B tries to unlock TIC-105 (unauthorized unlock test)
  console.log('Test 4: Socket B attempts unauthorized unlock on TIC-105...');
  const unauthorizedUnlock = await new Promise((resolve) => {
    socketB.emit('unlock_ticket', { ticketId: 'TIC-105' }, resolve);
  });
  console.log('[PASS] Socket B unauthorized unlock result:', unauthorizedUnlock);
  if (unauthorizedUnlock.success !== false || unauthorizedUnlock.error !== 'UNAUTHORIZED_UNLOCK') {
    throw new Error('Unauthorized unlock was not rejected');
  }

  // Test 5: Socket A unlocks TIC-105 -> must broadcast ticket_unlocked
  console.log('Test 5: Socket A unlocks TIC-105...');
  const unlockPromiseB = new Promise((resolve) => {
    socketB.once('ticket_unlocked', (payload) => {
      resolve(payload);
    });
  });

  const unlockAckA = await new Promise((resolve) => {
    socketA.emit('unlock_ticket', { ticketId: 'TIC-105' }, resolve);
  });
  console.log('[PASS] Socket A unlock ack:', unlockAckA);

  const unlockBroadcastToB = await unlockPromiseB;
  console.log('[PASS] Socket B received broadcast ticket_unlocked:', unlockBroadcastToB);

  // Test 6: Ghost Disconnect test! Socket A locks TIC-102 and then abruptly disconnects
  console.log('Test 6: Ghost Disconnect test: Socket A locks TIC-102 then disconnects...');
  await new Promise((resolve) => {
    socketA.emit('lock_ticket', { ticketId: 'TIC-102' }, resolve);
  });

  const ghostDisconnectPromiseB = new Promise((resolve) => {
    socketB.once('ticket_unlocked', (payload) => {
      resolve(payload);
    });
  });

  // Disconnect Socket A
  socketA.disconnect();

  const ghostPayload = await ghostDisconnectPromiseB;
  console.log('[PASS] Socket B received auto-unlock from ghost disconnect:', ghostPayload);
  if (ghostPayload.ticketId !== 'TIC-102' || ghostPayload.reason !== 'disconnect') {
    throw new Error('Ghost disconnect auto-unlock failed');
  }

  socketB.disconnect();
  console.log('=== ALL SOCKET CONCURRENCY & GHOST DISCONNECT TESTS PASSED ===');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('[FAIL] Socket test error:', err);
  process.exit(1);
});
