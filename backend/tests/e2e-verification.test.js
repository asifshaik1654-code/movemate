const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/database');
const {
  User,
  Move,
  Room,
  Box,
  InventoryItem,
  Task,
  Expense,
  ServiceBooking,
  ActivityLog,
  MoveMember
} = require('../src/models');

const testPort = 5065;

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

const runE2ETests = async () => {
  console.log('🧪 Starting MoveMate Phase 10: End-to-End Full-Stack Verification Tests...\n');

  let server;
  const uid = Date.now();
  let ownerToken, ownerId, moveId;
  let helperToken, helperId, memberDocId;
  let roomId1, roomId2;
  let boxId1, boxId2;
  let itemId1, itemId2, itemId3;
  let taskId1, taskId2, taskId3;
  let expenseId1, expenseId2;
  let bookingId1, bookingId2;

  try {
    await connectDB();

    server = app.listen(testPort, '127.0.0.1', async () => {
      try {
        // ── 1. System Health ───────────────────────────────────────────────
        console.log('Test 1: GET /api/v1/health (System status check)');
        const rHealth = await sendRequest({ method: 'GET', path: '/api/v1/health' });
        if (rHealth.statusCode !== 200 || rHealth.body.data?.services?.api !== 'up') {
          throw new Error(`Health check failed: ${JSON.stringify(rHealth.body)}`);
        }
        console.log('System is healthy and API service is UP ✅\n');

        // ── 2. Register Owner ──────────────────────────────────────────────
        console.log('Test 2: POST /api/v1/auth/register (Owner onboarding)');
        const rOwner = await sendRequest({
          method: 'POST',
          path: '/api/v1/auth/register',
          body: {
            name: 'Sam Owner',
            email: `sam.owner.${uid}@movemate.test`,
            password: 'Password123!',
            phone: '+1 555-0100'
          }
        });
        if (rOwner.statusCode !== 201 || !rOwner.body.data?.token) {
          throw new Error(`Owner registration failed: ${JSON.stringify(rOwner.body)}`);
        }
        ownerToken = rOwner.body.data.token;
        ownerId = rOwner.body.data.user._id;
        console.log(`Owner registered with ID: ${ownerId} ✅\n`);

        // ── 3. Register Collaborator ───────────────────────────────────────
        console.log('Test 3: POST /api/v1/auth/register (Collaborator onboarding)');
        const rHelper = await sendRequest({
          method: 'POST',
          path: '/api/v1/auth/register',
          body: {
            name: 'Riley Helper',
            email: `riley.helper.${uid}@movemate.test`,
            password: 'Password123!',
            phone: '+1 555-0101'
          }
        });
        if (rHelper.statusCode !== 201 || !rHelper.body.data?.token) {
          throw new Error(`Helper registration failed: ${JSON.stringify(rHelper.body)}`);
        }
        helperToken = rHelper.body.data.token;
        helperId = rHelper.body.data.user._id;
        console.log(`Helper registered with ID: ${helperId} ✅\n`);

        // ── 4. Create Moving Plan ──────────────────────────────────────────
        console.log('Test 4: POST /api/v1/moves (Create moving plan)');
        const rMove = await sendRequest({
          method: 'POST',
          path: '/api/v1/moves',
          token: ownerToken,
          body: {
            title: 'E2E Seattle Relocation',
            moveDate: '2026-12-20T10:00:00.000Z',
            currentAddress: '100 Main St, Portland, OR',
            destinationAddress: '200 Pine St, Seattle, WA',
            notes: 'Complete household move with high-value electronics.'
          }
        });
        if (rMove.statusCode !== 201 || !rMove.body.data?._id) {
          throw new Error(`Move creation failed: ${JSON.stringify(rMove.body)}`);
        }
        moveId = rMove.body.data._id;
        console.log(`Moving plan created: ${moveId} ✅\n`);

        // ── 5. Create Rooms ────────────────────────────────────────────────
        console.log('Test 5: POST /api/v1/moves/:id/rooms (Create 2 rooms)');
        const rRoom1 = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${moveId}/rooms`,
          token: ownerToken,
          body: { name: 'Living Room', floor: '1st Floor', colorCode: '#4f46e5' }
        });
        const rRoom2 = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${moveId}/rooms`,
          token: ownerToken,
          body: { name: 'Kitchen', floor: '1st Floor', colorCode: '#10b981' }
        });
        if (rRoom1.statusCode !== 201 || rRoom2.statusCode !== 201) {
          throw new Error(`Room creation failed`);
        }
        roomId1 = rRoom1.body.data._id;
        roomId2 = rRoom2.body.data._id;
        console.log(`Rooms created: Living Room (${roomId1}) and Kitchen (${roomId2}) ✅\n`);

        // ── 6. Create Boxes with QR Codes ──────────────────────────────────
        console.log('Test 6: POST /api/v1/moves/:id/boxes (Create boxes with automated QR codes)');
        const rBox1 = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${moveId}/boxes`,
          token: ownerToken,
          body: {
            roomId: roomId1,
            description: 'OLED TV & Audio Gear',
            isFragile: true,
            isPriority: true,
            status: 'Not Started'
          }
        });
        const rBox2 = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${moveId}/boxes`,
          token: ownerToken,
          body: {
            roomId: roomId2,
            description: 'Ceramic Cookware & Plates',
            isFragile: true,
            isPriority: false,
            status: 'Not Started'
          }
        });
        if (rBox1.statusCode !== 201 || rBox2.statusCode !== 201) {
          throw new Error('Box creation failed');
        }
        boxId1 = rBox1.body.data._id;
        boxId2 = rBox2.body.data._id;

        // Inspect QR Code on Box 1
        const rBoxGet = await sendRequest({
          method: 'GET',
          path: `/api/v1/boxes/${boxId1}`,
          token: ownerToken
        });
        if (!rBoxGet.body.data?.qrCodeData || !rBoxGet.body.data.qrCodeData.startsWith('data:image/png;base64,')) {
          throw new Error('Box QR code generation failed or missing valid Base64 string');
        }
        console.log(`Boxes created: ${rBox1.body.data.boxLabel} and ${rBox2.body.data.boxLabel} with QR Codes ✅\n`);

        // ── 7. Inventory Items & Box Association ───────────────────────────
        console.log('Test 7: POST /api/v1/rooms/:id/items (Add inventory items)');
        const rItem1 = await sendRequest({
          method: 'POST',
          path: `/api/v1/rooms/${roomId1}/items`,
          token: ownerToken,
          body: { name: 'Sony Soundbar', boxId: boxId1, quantity: 1, estimatedValue: 400, isFragile: true }
        });
        const rItem2 = await sendRequest({
          method: 'POST',
          path: `/api/v1/rooms/${roomId2}/items`,
          token: ownerToken,
          body: { name: 'Cast Iron Skillet', boxId: boxId2, quantity: 2, estimatedValue: 120, isFragile: false }
        });
        const rItem3 = await sendRequest({
          method: 'POST',
          path: `/api/v1/rooms/${roomId2}/items`,
          token: ownerToken,
          body: { name: 'Coffee Grinder', quantity: 1, estimatedValue: 80, isFragile: false }
        });
        if (rItem1.statusCode !== 201 || rItem2.statusCode !== 201 || rItem3.statusCode !== 201) {
          throw new Error('Item creation failed');
        }
        itemId1 = rItem1.body.data._id;
        itemId2 = rItem2.body.data._id;
        itemId3 = rItem3.body.data._id;
        console.log('3 Inventory items created across 2 rooms ✅\n');

        // ── 8. Tasks (Essential & Non-Essential) ───────────────────────────
        console.log('Test 8: POST /api/v1/moves/:id/tasks (Create tasks)');
        const rTask1 = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${moveId}/tasks`,
          token: ownerToken,
          body: {
            title: 'Schedule Moving Truck Pickup',
            priority: 'High',
            isEssential: true,
            dueDate: '2026-12-10T12:00:00.000Z'
          }
        });
        const rTask2 = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${moveId}/tasks`,
          token: ownerToken,
          body: {
            title: 'Disconnect Cable Modem',
            priority: 'Medium',
            isEssential: false,
            dueDate: '2026-12-18T18:00:00.000Z'
          }
        });
        if (rTask1.statusCode !== 201 || rTask2.statusCode !== 201) {
          throw new Error('Task creation failed');
        }
        taskId1 = rTask1.body.data._id;
        taskId2 = rTask2.body.data._id;
        console.log('Essential and non-essential tasks created ✅\n');

        // ── 9. Collaboration & Task Assignment ─────────────────────────────
        console.log('Test 9: Collaboration workflow (Invite, assign, complete)');
        const rInvite = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${moveId}/members`,
          token: ownerToken,
          body: {
            email: `riley.helper.${uid}@movemate.test`,
            role: 'Editor'
          }
        });
        if (rInvite.statusCode !== 201) {
          throw new Error(`Member invitation failed: ${JSON.stringify(rInvite.body)}`);
        }
        memberDocId = rInvite.body.data._id;

        // Assign task2 to helper
        await sendRequest({
          method: 'PATCH',
          path: `/api/v1/tasks/${taskId2}`,
          token: ownerToken,
          body: { assignedTo: helperId }
        });

        // Helper completes task2
        const rTaskDone = await sendRequest({
          method: 'PATCH',
          path: `/api/v1/tasks/${taskId2}`,
          token: helperToken,
          body: { status: 'Completed' }
        });
        if (rTaskDone.statusCode !== 200 || rTaskDone.body.data.status !== 'Completed') {
          throw new Error('Collaborator task completion failed');
        }

        // Verify member stats
        const rMembers = await sendRequest({
          method: 'GET',
          path: `/api/v1/moves/${moveId}/members`,
          token: ownerToken
        });
        const helperMember = rMembers.body.data.find((m) => m.user._id === helperId);
        if (!helperMember || helperMember.taskStats.completionRate !== 100) {
          throw new Error('Member task velocity statistic calculation incorrect');
        }
        console.log('Collaborator invited, task assigned, completed, and velocity verified at 100% ✅\n');

        // ── 10. Budget & Expenses ──────────────────────────────────────────
        console.log('Test 10: Budget & Expenses management with variance');
        const rExp1 = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${moveId}/expenses`,
          token: ownerToken,
          body: {
            title: 'Truck Rental Deposit',
            category: 'Truck Rental',
            estimatedCost: 1000,
            actualCost: 1150,
            isPaid: true
          }
        });
        const rExp2 = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${moveId}/expenses`,
          token: ownerToken,
          body: {
            title: 'Packing Supplies & Tape',
            category: 'Packing Supplies',
            estimatedCost: 200,
            actualCost: 180,
            isPaid: true
          }
        });
        if (rExp1.statusCode !== 201 || rExp2.statusCode !== 201) {
          throw new Error(`Expense creation failed: ${JSON.stringify(rExp1.body || rExp2.body)}`);
        }
        expenseId1 = rExp1.body.data._id;
        expenseId2 = rExp2.body.data._id;

        const rExpList = await sendRequest({
          method: 'GET',
          path: `/api/v1/moves/${moveId}/expenses`,
          token: ownerToken
        });
        const finSummary = rExpList.body.data.summary;
        if (finSummary.totalEstimatedCost !== 1200 || finSummary.totalActualCost !== 1330 || finSummary.variance !== 130) {
          throw new Error(`Financial summary calculation mismatch: ${JSON.stringify(finSummary)}`);
        }
        console.log('Budget tracking verified with accurate net variance ($+130) ✅\n');

        // ── 11. Service Bookings ───────────────────────────────────────────
        console.log('Test 11: Service bookings workflow');
        const rBook1 = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${moveId}/bookings`,
          token: ownerToken,
          body: {
            serviceType: 'Electricity Transfer',
            providerName: 'Seattle City Light',
            scheduledDate: '2026-12-19T09:00:00.000Z',
            status: 'Confirmed'
          }
        });
        const rBook2 = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${moveId}/bookings`,
          token: ownerToken,
          body: {
            serviceType: 'Internet / Cable',
            providerName: 'CenturyLink Fiber',
            scheduledDate: '2026-12-21T14:00:00.000Z',
            status: 'Booked'
          }
        });
        if (rBook1.statusCode !== 201 || rBook2.statusCode !== 201) {
          throw new Error('Service booking creation failed');
        }
        bookingId1 = rBook1.body.data._id;
        bookingId2 = rBook2.body.data._id;
        console.log('Service bookings created with status management ✅\n');

        // ── 12. Smart Readiness Dashboard ──────────────────────────────────
        console.log('Test 12: GET /api/v1/moves/:id/dashboard (Smart 4-Pillar Score calculation)');
        // Mark essential task completed & boxes packed
        await sendRequest({
          method: 'PATCH',
          path: `/api/v1/tasks/${taskId1}`,
          token: ownerToken,
          body: { status: 'Completed' }
        });
        // Transition boxes: Not Started -> Packing -> Packed
        await sendRequest({
          method: 'PATCH',
          path: `/api/v1/boxes/${boxId1}`,
          token: ownerToken,
          body: { status: 'Packing' }
        });
        await sendRequest({
          method: 'PATCH',
          path: `/api/v1/boxes/${boxId1}`,
          token: ownerToken,
          body: { status: 'Packed' }
        });
        await sendRequest({
          method: 'PATCH',
          path: `/api/v1/boxes/${boxId2}`,
          token: ownerToken,
          body: { status: 'Packing' }
        });
        await sendRequest({
          method: 'PATCH',
          path: `/api/v1/boxes/${boxId2}`,
          token: ownerToken,
          body: { status: 'Packed' }
        });

        const rDash = await sendRequest({
          method: 'GET',
          path: `/api/v1/moves/${moveId}/dashboard`,
          token: ownerToken
        });
        if (rDash.statusCode !== 200) {
          throw new Error(`Dashboard fetch failed: ${JSON.stringify(rDash.body)}`);
        }
        const { readinessScore, readinessStatus, pillarBreakdown } = rDash.body.data;
        if (readinessScore <= 0 || readinessScore > 100) {
          throw new Error(`Readiness score out of bounds: ${readinessScore}`);
        }
        console.log(`Readiness Score computed dynamically: ${readinessScore}% [${readinessStatus}] ✅`);
        console.log(`- Essential Tasks: ${pillarBreakdown.essentialTasks.scoreContribution} / 35 pts`);
        console.log(`- Box Packing: ${pillarBreakdown.boxPacking.scoreContribution} / 30 pts`);
        console.log(`- Inventory Items: ${pillarBreakdown.inventoryPacking.scoreContribution} / 20 pts`);
        console.log(`- Service Bookings: ${pillarBreakdown.utilityServices.scoreContribution} / 15 pts\n`);

        // ── 13. Moving Day Tracker ─────────────────────────────────────────
        console.log('Test 13: GET /api/v1/moves/:id/tracking (Moving Day Tracker transit pipeline)');
        // Advance box 1: Packed -> Loaded -> In Transit -> Delivered
        await sendRequest({
          method: 'PATCH',
          path: `/api/v1/boxes/${boxId1}`,
          token: ownerToken,
          body: { status: 'Loaded' }
        });
        await sendRequest({
          method: 'PATCH',
          path: `/api/v1/boxes/${boxId1}`,
          token: ownerToken,
          body: { status: 'In Transit' }
        });
        await sendRequest({
          method: 'PATCH',
          path: `/api/v1/boxes/${boxId1}`,
          token: ownerToken,
          body: { status: 'Delivered' }
        });

        const rTrack = await sendRequest({
          method: 'GET',
          path: `/api/v1/moves/${moveId}/tracking`,
          token: ownerToken
        });
        if (rTrack.statusCode !== 200 || rTrack.body.data.deliveryPercentage !== 50) {
          throw new Error(`Delivery percentage calculation failed: ${JSON.stringify(rTrack.body.data)}`);
        }
        if (rTrack.body.data.transitStages.deliveredCount !== 1) {
          throw new Error('Delivered stages count mismatch');
        }
        console.log(`Tracker updated: 50% delivery achieved (1/2 boxes delivered) ✅\n`);

        // ── 14. Activity Timeline ──────────────────────────────────────────
        console.log('Test 14: GET /api/v1/moves/:id/activity (Audit history timeline)');
        const rActivity = await sendRequest({
          method: 'GET',
          path: `/api/v1/moves/${moveId}/activity?limit=50`,
          token: ownerToken
        });
        if (rActivity.statusCode !== 200 || rActivity.body.data.activities.length === 0) {
          throw new Error('Activity history log is empty');
        }
        console.log(`Recorded ${rActivity.body.data.activities.length} activity audit events across the lifecycle ✅\n`);

        // ── 15. Cascade Delete & Cleanup ───────────────────────────────────
        console.log('Test 15: DELETE /api/v1/moves/:id (Verify cascade deletion)');
        const rDel = await sendRequest({
          method: 'DELETE',
          path: `/api/v1/moves/${moveId}`,
          token: ownerToken
        });
        if (rDel.statusCode !== 200) {
          throw new Error('Move deletion failed');
        }

        // Verify child records cascaded
        const [roomsLeft, boxesLeft, itemsLeft, tasksLeft, expLeft, bookLeft] = await Promise.all([
          Room.countDocuments({ moveId }),
          Box.countDocuments({ moveId }),
          InventoryItem.countDocuments({ moveId }),
          Task.countDocuments({ moveId }),
          Expense.countDocuments({ moveId }),
          ServiceBooking.countDocuments({ moveId })
        ]);
        if (roomsLeft + boxesLeft + itemsLeft + tasksLeft + expLeft + bookLeft !== 0) {
          throw new Error('Cascade deletion did not remove all child records');
        }
        console.log('All linked records cleanly cascaded on plan deletion ✅\n');

        // Clean up test users
        await User.deleteMany({ _id: { $in: [ownerId, helperId] } });
        console.log('Test users cleaned up ✅\n');

        console.log('🎉 ALL PHASE 10 END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY!');
      } catch (err) {
        console.error('❌ E2E Test execution failed:', err);
        process.exitCode = 1;
      } finally {
        server.close();
        await disconnectDB();
      }
    });
  } catch (err) {
    console.error('Database connection error in E2E tests:', err);
    process.exitCode = 1;
  }
};

runE2ETests();
