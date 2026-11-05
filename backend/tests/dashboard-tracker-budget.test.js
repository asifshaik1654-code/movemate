const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/database');
const { User, Move, Room, Box, InventoryItem, Task, Expense, ServiceBooking, ActivityLog, MoveMember } = require('../src/models');

const testPort = 5060;

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

const runPhase8Tests = async () => {
  console.log('🧪 Starting Phase 8 Dashboard, Tracker, Budget & Services Integration Tests...\n');

  let server;
  const uid = Date.now();
  let ownerToken, ownerId, moveId;
  let strangerToken, strangerId;
  let expenseId1, expenseId2, bookingId1, bookingId2;
  let roomId, boxId1, boxId2, itemId1, itemId2, taskId1, taskId2;

  try {
    await connectDB();

    server = app.listen(testPort, '127.0.0.1', async () => {
      try {
        // ── Setup ─────────────────────────────────────────────────────────
        console.log('Setup: Register owner and create move');
        const rOwner = await sendRequest({
          method: 'POST', path: '/api/v1/auth/register',
          body: { name: 'Dashboard Owner', email: `p8_owner_${uid}@test.com`, password: 'Password123!' }
        });
        ownerToken = rOwner.body.data.token;
        ownerId = rOwner.body.data.user._id;

        const rStranger = await sendRequest({
          method: 'POST', path: '/api/v1/auth/register',
          body: { name: 'Stranger User', email: `p8_stranger_${uid}@test.com`, password: 'Password123!' }
        });
        strangerToken = rStranger.body.data.token;
        strangerId = rStranger.body.data.user._id;

        const rMove = await sendRequest({
          method: 'POST', path: '/api/v1/moves', token: ownerToken,
          body: {
            title: 'Phase 8 Moving Plan',
            currentAddress: '100 Sunset Blvd',
            destinationAddress: '200 Ocean Ave',
            moveDate: '2026-12-30T10:00:00Z'
          }
        });
        moveId = rMove.body.data._id;
        console.log(`Move created: ${moveId} ✅\n`);

        // ── TEST 1: Empty Dashboard Safety Check ──────────────────────────
        console.log('Test 1: GET /api/v1/moves/:moveId/dashboard (Empty move safety)');
        const t1 = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/dashboard`, token: ownerToken
        });
        console.log(`Status: ${t1.statusCode}, ReadinessScore: ${t1.body.data.readinessScore}`);
        if (t1.statusCode !== 200) throw new Error('Failed to retrieve empty dashboard');
        if (t1.body.data.readinessScore !== 0) throw new Error(`Expected score 0, got ${t1.body.data.readinessScore}`);
        if (t1.body.data.readinessStatus !== 'Not Ready') throw new Error('Expected status "Not Ready"');
        const p = t1.body.data.pillarBreakdown;
        if (p.essentialTasks.weightPercentage !== 35 || p.boxPacking.weightPercentage !== 30 ||
            p.inventoryPacking.weightPercentage !== 20 || p.utilityServices.weightPercentage !== 15) {
          throw new Error('Pillar weights do not match 35/30/20/15 specifications');
        }
        console.log('Empty dashboard handled safely with 0% score and correct pillar weights ✅');
        console.log('✅ Test 1 Passed!\n');

        // ── TEST 2: Create Expense 1 (Movers) ─────────────────────────────
        console.log('Test 2: POST /api/v1/moves/:moveId/expenses (Create expense)');
        const t2 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/expenses`, token: ownerToken,
          body: {
            category: 'Movers',
            title: 'Professional Mover Deposit',
            estimatedCost: 1200,
            actualCost: 1350,
            isPaid: true
          }
        });
        console.log(`Status: ${t2.statusCode}`);
        if (t2.statusCode !== 201 || !t2.body.data._id) throw new Error('Expense 1 creation failed');
        expenseId1 = t2.body.data._id;
        console.log(`Expense created: "${t2.body.data.title}" ($${t2.body.data.actualCost}) ✅`);
        console.log('✅ Test 2 Passed!\n');

        // ── TEST 3: Create Expense 2 (Packing Supplies) ───────────────────
        console.log('Test 3: POST /api/v1/moves/:moveId/expenses (Second expense)');
        const t3 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/expenses`, token: ownerToken,
          body: {
            category: 'Packing Supplies',
            title: 'Bubble Wrap & Tape',
            estimatedCost: 150,
            actualCost: 100,
            isPaid: false
          }
        });
        if (t3.statusCode !== 201) throw new Error('Expense 2 creation failed');
        expenseId2 = t3.body.data._id;
        console.log(`Expense created: "${t3.body.data.title}" ($${t3.body.data.actualCost}) ✅`);
        console.log('✅ Test 3 Passed!\n');

        // ── TEST 4: List Expenses & Summary Aggregation ───────────────────
        console.log('Test 4: GET /api/v1/moves/:moveId/expenses (Financial variance calculation)');
        const t4 = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/expenses`, token: ownerToken
        });
        console.log(`Status: ${t4.statusCode}, Count: ${t4.body.data.expenses.length}`);
        const sm = t4.body.data.summary;
        console.log(`Financial Summary: Estimated=$${sm.totalEstimatedCost}, Actual=$${sm.totalActualCost}, Variance=$${sm.variance}, isOverBudget=${sm.isOverBudget}`);
        if (sm.totalEstimatedCost !== 1350 || sm.totalActualCost !== 1450 || sm.variance !== 100 || !sm.isOverBudget) {
          throw new Error('Financial variance calculation mismatch');
        }
        if (sm.categoryBreakdown.Movers.actual !== 1350) throw new Error('Category breakdown mismatch');
        console.log('Financial summary and variance verified ✅');
        console.log('✅ Test 4 Passed!\n');

        // ── TEST 5: Update Expense (PATCH) ────────────────────────────────
        console.log('Test 5: PATCH /api/v1/expenses/:expenseId (Update expense)');
        const t5 = await sendRequest({
          method: 'PATCH', path: `/api/v1/expenses/${expenseId2}`, token: ownerToken,
          body: { actualCost: 120, isPaid: true }
        });
        console.log(`Status: ${t5.statusCode}`);
        if (t5.statusCode !== 200 || t5.body.data.actualCost !== 120 || !t5.body.data.isPaid) {
          throw new Error('Expense update failed');
        }
        console.log(`Updated expense actualCost: $${t5.body.data.actualCost}, isPaid: ${t5.body.data.isPaid} ✅`);
        console.log('✅ Test 5 Passed!\n');

        // ── TEST 6: Delete Expense ────────────────────────────────────────
        console.log('Test 6: DELETE /api/v1/expenses/:expenseId (Delete expense)');
        const t6 = await sendRequest({
          method: 'DELETE', path: `/api/v1/expenses/${expenseId2}`, token: ownerToken
        });
        console.log(`Status: ${t6.statusCode}`);
        if (t6.statusCode !== 200 || !t6.body.data.deleted) throw new Error('Expense deletion failed');
        console.log('Expense deleted successfully ✅');
        console.log('✅ Test 6 Passed!\n');

        // ── TEST 7: Create Service Booking 1 (Electricity) ────────────────
        console.log('Test 7: POST /api/v1/moves/:moveId/bookings (Create booking)');
        const t7 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/bookings`, token: ownerToken,
          body: {
            serviceType: 'Electricity Transfer',
            providerName: 'City Power & Electric',
            scheduledDate: '2026-12-28T09:00:00Z',
            status: 'Booked',
            cost: 50
          }
        });
        console.log(`Status: ${t7.statusCode}`);
        if (t7.statusCode !== 201 || !t7.body.data._id) throw new Error('Booking 1 creation failed');
        bookingId1 = t7.body.data._id;
        console.log(`Booking created: ${t7.body.data.serviceType} (${t7.body.data.providerName}) ✅`);
        console.log('✅ Test 7 Passed!\n');

        // ── TEST 8: Create Service Booking 2 (Moving Company - Confirmed) ─
        console.log('Test 8: POST /api/v1/moves/:moveId/bookings (Second booking - Confirmed)');
        const t8 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/bookings`, token: ownerToken,
          body: {
            serviceType: 'Moving Company',
            providerName: 'Express Moving Pros',
            scheduledDate: '2026-12-30T08:00:00Z',
            status: 'Confirmed',
            confirmationNumber: 'EXP-98765',
            cost: 1200
          }
        });
        if (t8.statusCode !== 201) throw new Error('Booking 2 creation failed');
        bookingId2 = t8.body.data._id;
        console.log(`Booking created: ${t8.body.data.serviceType} (${t8.body.data.status}) ✅`);
        console.log('✅ Test 8 Passed!\n');

        // ── TEST 9: List Service Bookings ─────────────────────────────────
        console.log('Test 9: GET /api/v1/moves/:moveId/bookings (List bookings)');
        const t9 = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/bookings`, token: ownerToken
        });
        console.log(`Status: ${t9.statusCode}, Count: ${t9.body.data.bookings.length}`);
        if (t9.statusCode !== 200 || t9.body.data.bookings.length !== 2) throw new Error('Expected 2 bookings');
        if (t9.body.data.summary.confirmedOrCompleted !== 1) throw new Error('Expected 1 confirmedOrCompleted');
        console.log('Bookings retrieved with accurate status counts ✅');
        console.log('✅ Test 9 Passed!\n');

        // ── TEST 10: Update Service Booking Status ────────────────────────
        console.log('Test 10: PATCH /api/v1/bookings/:bookingId (Update to Completed)');
        const t10 = await sendRequest({
          method: 'PATCH', path: `/api/v1/bookings/${bookingId1}`, token: ownerToken,
          body: { status: 'Completed' }
        });
        console.log(`Status: ${t10.statusCode}`);
        if (t10.statusCode !== 200 || t10.body.data.status !== 'Completed') throw new Error('Booking update failed');
        console.log(`Booking status updated to: ${t10.body.data.status} ✅`);
        console.log('✅ Test 10 Passed!\n');

        // ── TEST 11: Create Room, Boxes, Items, and Essential Tasks ───────
        console.log('Test 11: Setup resources for Weighted Readiness calculation');
        // Room
        const rRoom = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/rooms`, token: ownerToken,
          body: { name: 'Kitchen', colorCode: '#F59E0B' }
        });
        roomId = rRoom.body.data._id;

        // Box 1 (Not Started -> Packing -> Packed)
        const rBox1 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/boxes`, token: ownerToken,
          body: { roomId, description: 'Dishes and cutlery' }
        });
        boxId1 = rBox1.body.data._id;
        await sendRequest({ method: 'PATCH', path: `/api/v1/boxes/${boxId1}`, token: ownerToken, body: { status: 'Packing' } });
        await sendRequest({ method: 'PATCH', path: `/api/v1/boxes/${boxId1}`, token: ownerToken, body: { status: 'Packed' } });

        // Box 2 (Fragile, Not Started)
        const rBox2 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/boxes`, token: ownerToken,
          body: { roomId, description: 'Crystal Glassware', isFragile: true, isPriority: true }
        });
        boxId2 = rBox2.body.data._id;

        // Item 1 (Assigned to Box 1 -> auto-packed)
        const rItem1 = await sendRequest({
          method: 'POST', path: `/api/v1/rooms/${roomId}/items`, token: ownerToken,
          body: { name: 'Dinner Plates', quantity: 8, boxId: boxId1, isFragile: true, estimatedValue: 120 }
        });
        itemId1 = rItem1.body.data._id;

        // Item 2 (Unpacked)
        const rItem2 = await sendRequest({
          method: 'POST', path: `/api/v1/rooms/${roomId}/items`, token: ownerToken,
          body: { name: 'Spice Rack', quantity: 1, estimatedValue: 30 }
        });
        itemId2 = rItem2.body.data._id;

        // Task 1: Essential, Completed
        const rTask1 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/tasks`, token: ownerToken,
          body: { title: 'Sign new apartment lease', priority: 'Urgent', isEssential: true }
        });
        taskId1 = rTask1.body.data._id;
        await sendRequest({ method: 'PATCH', path: `/api/v1/tasks/${taskId1}`, token: ownerToken, body: { status: 'Completed' } });

        // Task 2: Essential, Pending
        const rTask2 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/tasks`, token: ownerToken,
          body: { title: 'Return old parking pass', priority: 'High', isEssential: true }
        });
        taskId2 = rTask2.body.data._id;

        console.log('Resources created: 1 Room, 2 Boxes (1 Packed), 2 Items (1 Packed), 2 Essential Tasks (1 Completed), 2 Services (both Confirmed/Completed) ✅');
        console.log('✅ Test 11 Passed!\n');

        // ── TEST 12: Verify Smart Readiness Score & 4 Pillars ─────────────
        console.log('Test 12: GET /api/v1/moves/:moveId/dashboard (Verify 4-Pillar Score Calculation)');
        const t12 = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/dashboard`, token: ownerToken
        });
        console.log(`Status: ${t12.statusCode}`);
        if (t12.statusCode !== 200) throw new Error('Dashboard retrieval failed');

        const d = t12.body.data;
        const pb = d.pillarBreakdown;
        console.log(`Readiness Score: ${d.readinessScore}% (${d.readinessStatus})`);
        console.log(`- Essential Tasks (35%): contribution=${pb.essentialTasks.scoreContribution}, progress=${pb.essentialTasks.progressPercentage}%`);
        console.log(`- Box Packing (30%): contribution=${pb.boxPacking.scoreContribution}, progress=${pb.boxPacking.progressPercentage}%`);
        console.log(`- Inventory (20%): contribution=${pb.inventoryPacking.scoreContribution}, progress=${pb.inventoryPacking.progressPercentage}%`);
        console.log(`- Services (15%): contribution=${pb.utilityServices.scoreContribution}, progress=${pb.utilityServices.progressPercentage}%`);

        // Check pillar scores:
        // Essential Tasks: 1/2 = 50% * 35 = 17.5
        // Box Packing: 1/2 = 50% * 30 = 15
        // Inventory: 1/2 = 50% * 20 = 10
        // Services: 2/2 = 100% * 15 = 15
        // Total = 17.5 + 15 + 10 + 15 = 57.5 => 58%
        if (pb.essentialTasks.progressPercentage !== 50) throw new Error('Essential tasks progress mismatch');
        if (pb.boxPacking.progressPercentage !== 50) throw new Error('Box packing progress mismatch');
        if (pb.inventoryPacking.progressPercentage !== 50) throw new Error('Inventory packing progress mismatch');
        if (pb.utilityServices.progressPercentage !== 100) throw new Error('Services progress mismatch');
        if (d.readinessScore < 57 || d.readinessScore > 58) throw new Error(`Expected score ~58, got ${d.readinessScore}`);
        if (d.readinessStatus !== 'In Progress') throw new Error(`Expected "In Progress", got ${d.readinessStatus}`);
        console.log('4-Pillar formula executed with mathematical precision ✅');
        console.log('✅ Test 12 Passed!\n');

        // ── TEST 13: Moving Day Live Tracker ──────────────────────────────
        console.log('Test 13: GET /api/v1/moves/:moveId/tracking (Live tracking baseline)');
        const t13 = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/tracking`, token: ownerToken
        });
        console.log(`Status: ${t13.statusCode}, TotalBoxes: ${t13.body.data.totalBoxes}, Delivered: ${t13.body.data.deliveredBoxes}`);
        if (t13.statusCode !== 200) throw new Error('Tracking retrieval failed');
        if (t13.body.data.totalBoxes !== 2) throw new Error('Expected 2 total boxes');
        if (t13.body.data.deliveryPercentage !== 0) throw new Error('Expected 0% delivery initially');
        if (t13.body.data.fragileBoxes.length !== 1) throw new Error('Expected 1 fragile box');
        console.log('Tracking baseline verified with fragile container highlighted ✅');
        console.log('✅ Test 13 Passed!\n');

        // ── TEST 14: Moving Day Box Delivery Update ───────────────────────
        console.log('Test 14: Advance Box 1 through transit to Delivered (Packed -> Loaded -> In Transit -> Delivered)');
        await sendRequest({ method: 'PATCH', path: `/api/v1/boxes/${boxId1}`, token: ownerToken, body: { status: 'Loaded' } });
        await sendRequest({ method: 'PATCH', path: `/api/v1/boxes/${boxId1}`, token: ownerToken, body: { status: 'In Transit' } });
        const rDel = await sendRequest({ method: 'PATCH', path: `/api/v1/boxes/${boxId1}`, token: ownerToken, body: { status: 'Delivered' } });
        if (rDel.statusCode !== 200) throw new Error('Box delivery transition failed');

        const t14 = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/tracking`, token: ownerToken
        });
        console.log(`Status: ${t14.statusCode}, Delivered: ${t14.body.data.deliveredBoxes}, Delivery%: ${t14.body.data.deliveryPercentage}%`);
        if (t14.body.data.deliveredBoxes !== 1 || t14.body.data.deliveryPercentage !== 50) {
          throw new Error('Delivery statistics mismatch');
        }
        if (t14.body.data.transitStages.deliveredCount !== 1) throw new Error('Delivered count mismatch');
        console.log('Box delivery progress updated in real time (50%) ✅');
        console.log('✅ Test 14 Passed!\n');

        // ── TEST 15: Missing Box Detection in Tracker ─────────────────────
        console.log('Test 15: Flag Box 2 as Missing and verify alert in Tracker');
        const rMiss = await sendRequest({
          method: 'PATCH', path: `/api/v1/boxes/${boxId2}`, token: ownerToken, body: { status: 'Missing' }
        });
        if (rMiss.statusCode !== 200) throw new Error('Flagging box missing failed');

        const t15 = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/tracking`, token: ownerToken
        });
        console.log(`Status: ${t15.statusCode}, MissingCount: ${t15.body.data.transitStages.missingCount}`);
        if (t15.body.data.transitStages.missingCount !== 1) throw new Error('Expected 1 missing box');
        if (t15.body.data.missingBoxes[0].boxLabel !== 'BOX-KIT-002') throw new Error('Missing box label mismatch');
        console.log('Missing box flagged and surfaced immediately in tracker ✅');
        console.log('✅ Test 15 Passed!\n');

        // ── TEST 16: Activity Timeline API ────────────────────────────────
        console.log('Test 16: GET /api/v1/moves/:moveId/activity (Paginated activity audit log)');
        const t16 = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/activity?limit=10`, token: ownerToken
        });
        console.log(`Status: ${t16.statusCode}, ActivityCount: ${t16.body.data.activities.length}, Total: ${t16.body.data.pagination.total}`);
        if (t16.statusCode !== 200 || t16.body.data.activities.length === 0) throw new Error('Activity timeline failed');
        // Verify chronological order: newest first
        const acts = t16.body.data.activities;
        const isDescending = acts.every((act, i) => i === 0 || new Date(act.createdAt) <= new Date(acts[i - 1].createdAt));
        if (!isDescending) throw new Error('Activity log not in descending chronological order');
        console.log(`Recorded operations include: ${acts.slice(0, 4).map(a => a.action).join(', ')} ✅`);
        console.log('✅ Test 16 Passed!\n');

        // ── TEST 17: Multi-Tenant Boundary: Dashboard & Tracker ───────────
        console.log('Test 17: StrangerUser denied access to dashboard and tracking');
        const t17a = await sendRequest({ method: 'GET', path: `/api/v1/moves/${moveId}/dashboard`, token: strangerToken });
        const t17b = await sendRequest({ method: 'GET', path: `/api/v1/moves/${moveId}/tracking`, token: strangerToken });
        if (t17a.statusCode !== 403 || t17b.statusCode !== 403) throw new Error('Expected 403 for stranger on dashboard/tracker');
        console.log('Dashboard and tracker multi-tenant boundary verified (403) ✅');
        console.log('✅ Test 17 Passed!\n');

        // ── TEST 18: Multi-Tenant Boundary: Expenses & Bookings ───────────
        console.log('Test 18: StrangerUser denied access to direct expense and booking routes');
        const t18a = await sendRequest({ method: 'GET', path: `/api/v1/expenses/${expenseId1}`, token: strangerToken });
        const t18b = await sendRequest({ method: 'GET', path: `/api/v1/bookings/${bookingId1}`, token: strangerToken });
        if (t18a.statusCode !== 403 || t18b.statusCode !== 403) throw new Error('Expected 403 for stranger on expense/booking');
        console.log('Direct resource access authorization verified (403) ✅');
        console.log('✅ Test 18 Passed!\n');

        // ── TEST 19: Cascade Deletion of Expenses & Bookings ──────────────
        console.log('Test 19: DELETE /api/v1/moves/:moveId (Cascade delete verified for Phase 8)');
        const t19 = await sendRequest({
          method: 'DELETE', path: `/api/v1/moves/${moveId}`, token: ownerToken
        });
        if (t19.statusCode !== 200) throw new Error('Move deletion failed');

        const remainingExpenses = await Expense.countDocuments({ moveId });
        const remainingBookings = await ServiceBooking.countDocuments({ moveId });
        if (remainingExpenses !== 0 || remainingBookings !== 0) {
          throw new Error(`Cascade deletion failed: ${remainingExpenses} expenses, ${remainingBookings} bookings remaining`);
        }
        console.log('Expenses and Bookings cleanly cascaded on plan deletion ✅');
        console.log('✅ Test 19 Passed!\n');

        // ── TEST 20: Clean up test users ──────────────────────────────────
        console.log('Test 20: Cleanup Phase 8 test users');
        await User.deleteMany({ _id: { $in: [ownerId, strangerId] } });
        console.log('Test users cleaned up ✅');
        console.log('✅ Test 20 Passed!\n');

        console.log('\n🎉 ALL PHASE 8 DASHBOARD, TRACKER, BUDGET & SERVICES TESTS PASSED SUCCESSFULLY!');
        server.close(async () => { await disconnectDB(); process.exit(0); });

      } catch (innerErr) {
        console.error('❌ Test assertion error:', innerErr.message);
        try {
          if (moveId) {
            await Promise.all([
              Task.deleteMany({ moveId }),
              Room.deleteMany({ moveId }),
              Box.deleteMany({ moveId }),
              InventoryItem.deleteMany({ moveId }),
              Expense.deleteMany({ moveId }),
              ServiceBooking.deleteMany({ moveId }),
              MoveMember.deleteMany({ moveId }),
              ActivityLog.deleteMany({ moveId }),
              Move.findByIdAndDelete(moveId)
            ]);
          }
          await User.deleteMany({ _id: { $in: [ownerId, strangerId] } });
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

runPhase8Tests();

