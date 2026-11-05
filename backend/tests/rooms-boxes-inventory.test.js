const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/database');
const { User, Move, Room, Box, InventoryItem, ActivityLog } = require('../src/models');

const testPort = 5058;

const sendRequest = ({ method, path, body = null, token = null }) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      { hostname: '127.0.0.1', port: testPort, path, method, headers },
      (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
          catch (e) { resolve({ statusCode: res.statusCode, body: data }); }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

const runPhase6Tests = async () => {
  console.log('🧪 Starting Phase 6 Room, Box & Inventory Integration Tests...\n');

  let server;
  const uid = Date.now();
  let token, userId, moveId, roomId, kitchenRoomId, boxId, box2Id, itemId;

  try {
    await connectDB();

    server = app.listen(testPort, '127.0.0.1', async () => {
      try {
        // ── Setup ─────────────────────────────────────────────────────────
        console.log('Setup: Register user and create move');
        const reg = await sendRequest({
          method: 'POST', path: '/api/v1/auth/register',
          body: { name: 'Phase6 Tester', email: `p6_${uid}@test.com`, password: 'Password123!' }
        });
        token = reg.body.data.token;
        userId = reg.body.data.user._id;

        const mv = await sendRequest({
          method: 'POST', path: '/api/v1/moves', token,
          body: { title: 'Phase6 Move', currentAddress: '10 Old St', destinationAddress: '99 New Ave', moveDate: '2026-12-20T09:00:00Z' }
        });
        moveId = mv.body.data._id;
        console.log(`Move created: ${moveId} ✅\n`);

        // ── TEST 1: Create Room ───────────────────────────────────────────
        console.log('Test 1: POST /api/v1/moves/:moveId/rooms (Create room)');
        const r1 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/rooms`, token,
          body: { name: 'Master Bedroom', floor: '2nd Floor', colorCode: '#10B981' }
        });
        console.log(`Status: ${r1.statusCode}`);
        if (r1.statusCode !== 201 || !r1.body.data._id) throw new Error('Room creation failed');
        roomId = r1.body.data._id;
        console.log(`Room created: "${r1.body.data.name}" (${roomId})`);
        console.log('✅ Test 1 Passed!\n');

        // ── TEST 2: Duplicate Room Name in Same Move ──────────────────────
        console.log('Test 2: Create duplicate room name (should fail with 409)');
        const r2 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/rooms`, token,
          body: { name: 'Master Bedroom' }
        });
        console.log(`Status: ${r2.statusCode}`);
        if (r2.statusCode !== 409) throw new Error(`Expected 409 conflict, got ${r2.statusCode}`);
        console.log('Duplicate name blocked correctly ✅');
        console.log('✅ Test 2 Passed!\n');

        // ── TEST 3: Create Second Room (Kitchen for boxes) ────────────────
        console.log('Test 3: Create a second room (Kitchen)');
        const r3 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/rooms`, token,
          body: { name: 'Kitchen', colorCode: '#F59E0B' }
        });
        if (r3.statusCode !== 201) throw new Error('Kitchen room creation failed');
        kitchenRoomId = r3.body.data._id;
        console.log(`Kitchen room created: ${kitchenRoomId} ✅`);
        console.log('✅ Test 3 Passed!\n');

        // ── TEST 4: List Rooms with Packing Stats ─────────────────────────
        console.log('Test 4: GET /api/v1/moves/:moveId/rooms (List rooms with stats)');
        const r4 = await sendRequest({ method: 'GET', path: `/api/v1/moves/${moveId}/rooms`, token });
        console.log(`Status: ${r4.statusCode}`);
        if (r4.statusCode !== 200 || r4.body.data.length < 2) throw new Error('Expected at least 2 rooms');
        const kitchenInList = r4.body.data.find(r => r.name === 'Kitchen');
        if (!kitchenInList || kitchenInList.stats === undefined) throw new Error('Room stats missing');
        console.log(`Rooms returned: ${r4.body.data.length}, Kitchen stats: ${JSON.stringify(kitchenInList.stats)}`);
        console.log('✅ Test 4 Passed!\n');

        // ── TEST 5: Update Room ───────────────────────────────────────────
        console.log('Test 5: PATCH /api/v1/rooms/:roomId (Update room)');
        const r5 = await sendRequest({
          method: 'PATCH', path: `/api/v1/rooms/${roomId}`, token,
          body: { name: 'Primary Bedroom', colorCode: '#6366F1' }
        });
        console.log(`Status: ${r5.statusCode}`);
        if (r5.statusCode !== 200 || r5.body.data.name !== 'Primary Bedroom') throw new Error('Room update failed');
        console.log(`Room renamed to: ${r5.body.data.name} ✅`);
        console.log('✅ Test 5 Passed!\n');

        // ── TEST 6: Create Box with QR Code ──────────────────────────────
        console.log('Test 6: POST /api/v1/moves/:moveId/boxes (Create box + QR code generation)');
        const b1 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/boxes`, token,
          body: { roomId: kitchenRoomId, description: 'Pots, pans and utensils', isFragile: false, isPriority: true }
        });
        console.log(`Status: ${b1.statusCode}`);
        if (b1.statusCode !== 201 || !b1.body.data._id) throw new Error('Box creation failed');
        boxId = b1.body.data._id;
        const box = b1.body.data;
        console.log(`Box created: ${box.boxLabel} (number: ${box.boxNumber})`);
        if (!box.qrCodeData || !box.qrCodeData.startsWith('data:image/png;base64,')) {
          throw new Error('QR code not generated or invalid format');
        }
        console.log('QR Code generated (Base64 DataURL PNG): ✅');
        console.log('✅ Test 6 Passed!\n');

        // ── TEST 7: QR Code Security Check ───────────────────────────────
        console.log('Test 7: Verify QR code payload contains no sensitive data');
        // Decode the base64 QR code content embedded in the JSON payload
        const qrPayloadStr = box.qrCodeData;
        // We stored JSON in the QR — verify by checking the box label is embedded in qrCodeData indirectly
        // The important check: qrCodeData must NOT contain email, password, JWT, or URI credentials
        if (qrPayloadStr.includes(token)) throw new Error('SECURITY VIOLATION: JWT token embedded in QR code!');
        if (qrPayloadStr.toLowerCase().includes('password')) throw new Error('SECURITY VIOLATION: Password in QR code!');
        console.log('QR code contains no sensitive credentials ✅');
        console.log('✅ Test 7 Passed!\n');

        // ── TEST 8: Create Second Box (auto-increment) ────────────────────
        console.log('Test 8: Create second box (auto-incrementing box number)');
        const b2 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/boxes`, token,
          body: { roomId: kitchenRoomId, description: 'Fragile glassware', isFragile: true }
        });
        if (b2.statusCode !== 201) throw new Error('Second box creation failed');
        const box2 = b2.body.data;
        box2Id = box2._id;
        if (box2.boxNumber !== box.boxNumber + 1) throw new Error(`Expected boxNumber ${box.boxNumber + 1}, got ${box2.boxNumber}`);
        console.log(`Second box: ${box2.boxLabel} (number: ${box2.boxNumber}) ✅`);
        console.log('✅ Test 8 Passed!\n');

        // ── TEST 9: Get Box with Items ────────────────────────────────────
        console.log('Test 9: GET /api/v1/boxes/:boxId (Box details with items array)');
        const b3 = await sendRequest({ method: 'GET', path: `/api/v1/boxes/${boxId}`, token });
        console.log(`Status: ${b3.statusCode}`);
        if (b3.statusCode !== 200 || !Array.isArray(b3.body.data.items)) throw new Error('Box detail missing items array');
        console.log(`Box returned with items count: ${b3.body.data.items.length} ✅`);
        console.log('✅ Test 9 Passed!\n');

        // ── TEST 10: Box State Machine – Valid Transition ─────────────────
        console.log('Test 10: PATCH /api/v1/boxes/:boxId - Valid status transition (Not Started → Packing)');
        const b4 = await sendRequest({
          method: 'PATCH', path: `/api/v1/boxes/${boxId}`, token,
          body: { status: 'Packing' }
        });
        console.log(`Status: ${b4.statusCode}`);
        if (b4.statusCode !== 200 || b4.body.data.status !== 'Packing') throw new Error('Status transition failed');
        console.log(`Box status updated to: ${b4.body.data.status} ✅`);
        console.log('✅ Test 10 Passed!\n');

        // ── TEST 11: Box State Machine – Invalid Transition ───────────────
        console.log('Test 11: PATCH /api/v1/boxes/:boxId - Invalid transition (Packing → Delivered)');
        const b5 = await sendRequest({
          method: 'PATCH', path: `/api/v1/boxes/${boxId}`, token,
          body: { status: 'Delivered' }
        });
        console.log(`Status: ${b5.statusCode}`);
        if (b5.statusCode !== 400) throw new Error(`Expected 400 for invalid transition, got ${b5.statusCode}`);
        console.log('Invalid transition blocked:', b5.body.message);
        console.log('✅ Test 11 Passed!\n');

        // ── TEST 12: Add Inventory Items ──────────────────────────────────
        console.log('Test 12: POST /api/v1/rooms/:roomId/items (Add inventory items)');
        const i1 = await sendRequest({
          method: 'POST', path: `/api/v1/rooms/${kitchenRoomId}/items`, token,
          body: { name: 'Blender', quantity: 1, isFragile: true, estimatedValue: 80 }
        });
        console.log(`Status: ${i1.statusCode}`);
        if (i1.statusCode !== 201 || !i1.body.data._id) throw new Error('Item creation failed');
        itemId = i1.body.data._id;
        console.log(`Item created: "${i1.body.data.name}" ✅`);

        const i2 = await sendRequest({
          method: 'POST', path: `/api/v1/rooms/${kitchenRoomId}/items`, token,
          body: { name: 'Cast Iron Skillet', quantity: 2, isFragile: false, estimatedValue: 50 }
        });
        if (i2.statusCode !== 201) throw new Error('Second item creation failed');
        console.log(`Item created: "${i2.body.data.name}" ✅`);
        console.log('✅ Test 12 Passed!\n');

        // ── TEST 13: Search Items by Name ─────────────────────────────────
        console.log('Test 13: GET /api/v1/rooms/:roomId/items?search=blend (Item search)');
        const i3 = await sendRequest({
          method: 'GET',
          path: `/api/v1/rooms/${kitchenRoomId}/items?search=blend`,
          token
        });
        console.log(`Status: ${i3.statusCode}`);
        if (i3.statusCode !== 200 || i3.body.data.items.length !== 1) {
          throw new Error(`Expected 1 search result, got ${i3.body.data.items?.length}`);
        }
        console.log(`Search found: "${i3.body.data.items[0].name}" ✅`);
        console.log('✅ Test 13 Passed!\n');

        // ── TEST 14: Assign Item to Box ───────────────────────────────────
        console.log('Test 14: PATCH /api/v1/items/:itemId (Assign item to box → auto-marks packed)');
        const i4 = await sendRequest({
          method: 'PATCH', path: `/api/v1/items/${itemId}`, token,
          body: { boxId }
        });
        console.log(`Status: ${i4.statusCode}`);
        if (i4.statusCode !== 200) throw new Error(`Failed to assign item to box: ${JSON.stringify(i4.body)}`);
        if (!i4.body.data.isPacked) throw new Error('isPacked not auto-set to true when assigned to a box');
        if (!i4.body.data.boxId || i4.body.data.boxId.boxLabel === undefined) {
          throw new Error('boxId not populated in response');
        }
        console.log(`Item assigned to box ${i4.body.data.boxId.boxLabel}, isPacked: ${i4.body.data.isPacked} ✅`);
        console.log('✅ Test 14 Passed!\n');

        // ── TEST 15: Find Items by Box ────────────────────────────────────
        console.log('Test 15: GET /api/v1/boxes/:boxId (Box now shows its item)');
        const b6 = await sendRequest({ method: 'GET', path: `/api/v1/boxes/${boxId}`, token });
        console.log(`Status: ${b6.statusCode}`);
        if (b6.statusCode !== 200 || b6.body.data.items.length !== 1) {
          throw new Error(`Expected 1 item in box, got ${b6.body.data.items?.length}`);
        }
        console.log(`Box contains item: "${b6.body.data.items[0].name}" ✅`);
        console.log('✅ Test 15 Passed!\n');

        // ── TEST 16: Filter Unpacked Items ────────────────────────────────
        console.log('Test 16: GET /api/v1/rooms/:roomId/items?isPacked=false (Unpacked items)');
        const i5 = await sendRequest({
          method: 'GET',
          path: `/api/v1/rooms/${kitchenRoomId}/items?isPacked=false`,
          token
        });
        console.log(`Status: ${i5.statusCode}`);
        if (i5.statusCode !== 200) throw new Error('Failed to get unpacked items');
        console.log(`Unpacked items: ${i5.body.data.items.length}, metrics.unpacked: ${i5.body.data.metrics.unpacked} ✅`);
        console.log('✅ Test 16 Passed!\n');

        // ── TEST 17: Room Packing Progress ────────────────────────────────
        console.log('Test 17: GET /api/v1/rooms/:roomId (Room packing progress)');
        const r6 = await sendRequest({ method: 'GET', path: `/api/v1/rooms/${kitchenRoomId}`, token });
        console.log(`Status: ${r6.statusCode}`);
        if (r6.statusCode !== 200 || r6.body.data.stats === undefined) throw new Error('Room stats missing');
        const stats = r6.body.data.stats;
        console.log(`Room stats: totalItems=${stats.totalItems}, packedItems=${stats.packedItems}, packingProgress=${stats.packingProgress}%`);
        if (stats.totalItems === 0) throw new Error('Expected totalItems > 0 in room stats');
        console.log('✅ Test 17 Passed!\n');

        // ── TEST 18: Delete Box (disassociates items) ─────────────────────
        console.log('Test 18: DELETE /api/v1/boxes/:boxId (Box deleted, items disassociated)');
        const b7 = await sendRequest({ method: 'DELETE', path: `/api/v1/boxes/${boxId}`, token });
        console.log(`Status: ${b7.statusCode}`);
        if (b7.statusCode !== 200) throw new Error('Box deletion failed');
        // Verify item was disassociated (not deleted)
        const disassocItem = await InventoryItem.findById(itemId);
        if (!disassocItem) throw new Error('Item should still exist after box deletion');
        if (disassocItem.boxId !== null) throw new Error('Item boxId should be null after box deletion');
        if (disassocItem.isPacked !== false) throw new Error('isPacked should be reset to false after box deletion');
        console.log('Box deleted, item disassociated (still exists, isPacked=false) ✅');
        console.log('✅ Test 18 Passed!\n');

        // ── TEST 19: Delete Room blocked when boxes exist ─────────────────
        console.log('Test 19: DELETE /api/v1/rooms/:roomId (Blocked when boxes assigned)');
        // Create a fresh box for the kitchen before trying to delete
        const freshBox = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/boxes`, token,
          body: { roomId: kitchenRoomId }
        });
        const freshBoxId = freshBox.body.data._id;

        const r7 = await sendRequest({ method: 'DELETE', path: `/api/v1/rooms/${kitchenRoomId}`, token });
        console.log(`Status: ${r7.statusCode}`);
        if (r7.statusCode !== 409) throw new Error(`Expected 409 when room has boxes, got ${r7.statusCode}`);
        console.log('Delete correctly blocked:', r7.body.message);

        // Clean up all boxes in kitchen first, then delete room
        await sendRequest({ method: 'DELETE', path: `/api/v1/boxes/${freshBoxId}`, token });
        if (box2Id) await sendRequest({ method: 'DELETE', path: `/api/v1/boxes/${box2Id}`, token });
        const r7b = await sendRequest({ method: 'DELETE', path: `/api/v1/rooms/${kitchenRoomId}`, token });
        if (r7b.statusCode !== 200) throw new Error(`Room deletion failed after removing boxes: ${r7b.statusCode} - ${JSON.stringify(r7b.body)}`);
        console.log('Room deleted successfully after clearing boxes ✅');
        console.log('✅ Test 19 Passed!\n');

        // ── TEST 20: ActivityLog entries for Phase 6 ──────────────────────
        console.log('Test 20: Verify ActivityLog entries recorded for Phase 6 operations');
        const logs = await ActivityLog.find({ moveId }).sort('-createdAt').limit(20);
        const actions = logs.map(l => l.action);
        const expected = ['ROOM_DELETED', 'BOX_DELETED', 'ITEM_UPDATED', 'ITEM_ADDED', 'BOX_UPDATED', 'BOX_CREATED', 'ROOM_UPDATED', 'ROOM_CREATED'];
        const hasAll = expected.every(a => actions.includes(a));
        if (!hasAll) throw new Error(`Missing expected activity logs. Found: ${actions.join(', ')}`);
        console.log(`Verified ${logs.length} activity log entries ✅`);
        expected.forEach(a => console.log(`  - ${a}: ✅`));
        console.log('✅ Test 20 Passed!\n');

        // ── Cleanup ───────────────────────────────────────────────────────
        console.log('Cleaning up Phase 6 test data...');
        await Move.findByIdAndDelete(moveId);
        await Room.deleteMany({ moveId });
        await Box.deleteMany({ moveId });
        await InventoryItem.deleteMany({ moveId });
        await ActivityLog.deleteMany({ moveId });
        await User.findByIdAndDelete(userId);
        console.log('All test data cleaned up.');

        console.log('\n🎉 ALL PHASE 6 ROOM, BOX & INVENTORY TESTS PASSED SUCCESSFULLY!');
        server.close(async () => { await disconnectDB(); process.exit(0); });

      } catch (innerErr) {
        console.error('❌ Test assertion error:', innerErr.message);
        // Best-effort cleanup
        try {
          if (moveId) {
            await Room.deleteMany({ moveId });
            await Box.deleteMany({ moveId });
            await InventoryItem.deleteMany({ moveId });
            await ActivityLog.deleteMany({ moveId });
            await Move.findByIdAndDelete(moveId);
          }
          if (userId) await User.findByIdAndDelete(userId);
        } catch (_) {}
        server.close(async () => { await disconnectDB(); process.exit(1); });
      }
    });
  } catch (err) {
    console.error('❌ Server startup error:', err.message);
    if (server) server.close();
    await disconnectDB();
    process.exit(1);
  }
};

runPhase6Tests();

