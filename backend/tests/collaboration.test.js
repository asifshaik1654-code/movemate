const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/database');
const { User, Move, MoveMember, Task, ActivityLog } = require('../src/models');
const { ROLES } = require('../src/constants/roles');

const testPort = 5059;

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

const runPhase7Tests = async () => {
  console.log('🧪 Starting Phase 7 Responsibilities & Collaboration Tests...\n');

  let server;
  const uid = Date.now();
  let ownerToken, ownerId, moveId, ownerMemberId;
  let editorToken, editorId, editorMemberId, editorEmail;
  let viewerToken, viewerId, viewerMemberId, viewerEmail;
  let strangerToken, strangerId;
  let taskId1, taskId2;

  try {
    await connectDB();

    server = app.listen(testPort, '127.0.0.1', async () => {
      try {
        // ── Setup ─────────────────────────────────────────────────────────
        console.log('Setup: Register Owner, Editor, Viewer, and Stranger users');

        // Owner
        const rOwner = await sendRequest({
          method: 'POST', path: '/api/v1/auth/register',
          body: { name: 'Plan Owner', email: `owner_${uid}@test.com`, password: 'Password123!' }
        });
        ownerToken = rOwner.body.data.token;
        ownerId = rOwner.body.data.user._id;

        // Editor
        editorEmail = `editor_${uid}@test.com`;
        const rEditor = await sendRequest({
          method: 'POST', path: '/api/v1/auth/register',
          body: { name: 'Helpful Editor', email: editorEmail, password: 'Password123!' }
        });
        editorToken = rEditor.body.data.token;
        editorId = rEditor.body.data.user._id;

        // Viewer
        viewerEmail = `viewer_${uid}@test.com`;
        const rViewer = await sendRequest({
          method: 'POST', path: '/api/v1/auth/register',
          body: { name: 'Family Viewer', email: viewerEmail, password: 'Password123!' }
        });
        viewerToken = rViewer.body.data.token;
        viewerId = rViewer.body.data.user._id;

        // Stranger (unrelated user)
        const rStranger = await sendRequest({
          method: 'POST', path: '/api/v1/auth/register',
          body: { name: 'Stranger User', email: `stranger_${uid}@test.com`, password: 'Password123!' }
        });
        strangerToken = rStranger.body.data.token;
        strangerId = rStranger.body.data.user._id;

        // Create moving plan as Owner
        const rMove = await sendRequest({
          method: 'POST', path: '/api/v1/moves', token: ownerToken,
          body: {
            title: 'Collaboration Move',
            currentAddress: '42 Main St',
            destinationAddress: '88 Oak Ave',
            moveDate: '2026-12-15T09:00:00Z'
          }
        });
        moveId = rMove.body.data._id;
        console.log(`Moving plan created: ${moveId} ✅\n`);

        // Find Owner's MoveMember record
        const initialMembers = await MoveMember.find({ moveId });
        ownerMemberId = initialMembers[0]._id.toString();

        // ── TEST 1: Owner Self-Invitation Prevention ──────────────────────
        console.log('Test 1: POST /api/v1/moves/:moveId/members (Owner self-invitation prevention)');
        const t1 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/members`, token: ownerToken,
          body: { email: `owner_${uid}@test.com`, role: 'Editor' }
        });
        console.log(`Status: ${t1.statusCode}, Message: "${t1.body.message}"`);
        if (t1.statusCode !== 400) throw new Error(`Expected 400, got ${t1.statusCode}`);
        console.log('Owner self-invitation blocked correctly ✅');
        console.log('✅ Test 1 Passed!\n');

        // ── TEST 2: Non-existent User Invitation ──────────────────────────
        console.log('Test 2: POST /api/v1/moves/:moveId/members (Unregistered email rejection)');
        const t2 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/members`, token: ownerToken,
          body: { email: `nonexistent_${uid}@nobody.test`, role: 'Editor' }
        });
        console.log(`Status: ${t2.statusCode}, Message: "${t2.body.message}"`);
        if (t2.statusCode !== 404) throw new Error(`Expected 404, got ${t2.statusCode}`);
        console.log('Unregistered user correctly rejected with 404 ✅');
        console.log('✅ Test 2 Passed!\n');

        // ── TEST 3: Invite Editor User ────────────────────────────────────
        console.log('Test 3: POST /api/v1/moves/:moveId/members (Invite Editor)');
        const t3 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/members`, token: ownerToken,
          body: { email: editorEmail, role: 'Editor' }
        });
        console.log(`Status: ${t3.statusCode}`);
        if (t3.statusCode !== 201 || !t3.body.data._id) throw new Error('Editor invitation failed');
        editorMemberId = t3.body.data._id;
        console.log(`Editor invited: ${t3.body.data.userId.name} (${t3.body.data.role}) ✅`);
        console.log('✅ Test 3 Passed!\n');

        // ── TEST 4: Duplicate Invitation Prevention ───────────────────────
        console.log('Test 4: POST /api/v1/moves/:moveId/members (Duplicate invitation prevention)');
        const t4 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/members`, token: ownerToken,
          body: { email: editorEmail, role: 'Viewer' }
        });
        console.log(`Status: ${t4.statusCode}, Message: "${t4.body.message}"`);
        if (t4.statusCode !== 409) throw new Error(`Expected 409 Conflict, got ${t4.statusCode}`);
        console.log('Duplicate membership blocked correctly ✅');
        console.log('✅ Test 4 Passed!\n');

        // ── TEST 5: Invite Viewer User ────────────────────────────────────
        console.log('Test 5: POST /api/v1/moves/:moveId/members (Invite Viewer)');
        const t5 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/members`, token: ownerToken,
          body: { email: viewerEmail, role: 'Viewer' }
        });
        console.log(`Status: ${t5.statusCode}`);
        if (t5.statusCode !== 201 || !t5.body.data._id) throw new Error('Viewer invitation failed');
        viewerMemberId = t5.body.data._id;
        console.log(`Viewer invited: ${t5.body.data.userId.name} (${t5.body.data.role}) ✅`);
        console.log('✅ Test 5 Passed!\n');

        // ── TEST 6: List Members with Initial Stats ───────────────────────
        console.log('Test 6: GET /api/v1/moves/:moveId/members (List members with task stats)');
        const t6 = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/members`, token: ownerToken
        });
        console.log(`Status: ${t6.statusCode}, Count: ${t6.body.data.length}`);
        if (t6.statusCode !== 200 || t6.body.data.length !== 3) {
          throw new Error(`Expected 3 members, got ${t6.body.data?.length}`);
        }
        const editorMemberInList = t6.body.data.find(m => m.user._id.toString() === editorId);
        if (!editorMemberInList || !editorMemberInList.taskStats) {
          throw new Error('Member missing taskStats object');
        }
        console.log(`Editor initial taskStats: ${JSON.stringify(editorMemberInList.taskStats)} ✅`);
        if (editorMemberInList.taskStats.totalTasks !== 0) throw new Error('Expected 0 initial tasks');
        console.log('✅ Test 6 Passed!\n');

        // ── TEST 7: Assign Task to Authorized Member (Editor) ─────────────
        console.log('Test 7: POST /api/v1/moves/:moveId/tasks (Assign to authorized member)');
        const t7 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/tasks`, token: ownerToken,
          body: {
            title: 'Pack living room books',
            priority: 'High',
            assignedTo: editorId
          }
        });
        console.log(`Status: ${t7.statusCode}`);
        if (t7.statusCode !== 201 || !t7.body.data._id) throw new Error('Task creation with assignment failed');
        taskId1 = t7.body.data._id;
        console.log(`Task created & assigned to editor: ${taskId1} ✅`);
        console.log('✅ Test 7 Passed!\n');

        // ── TEST 8: Prevent Task Assignment to Non-Member ─────────────────
        console.log('Test 8: Prevent task assignment to non-member (StrangerUser)');
        const t8 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/tasks`, token: ownerToken,
          body: {
            title: 'Unauthorized assignment task',
            priority: 'Medium',
            assignedTo: strangerId
          }
        });
        console.log(`Status: ${t8.statusCode}, Message: "${t8.body.message}"`);
        if (t8.statusCode !== 400) throw new Error(`Expected 400 for non-member assignment, got ${t8.statusCode}`);
        console.log('Assignment to non-member blocked correctly ✅');
        console.log('✅ Test 8 Passed!\n');

        // ── TEST 9: Role Privilege Enforcement - Viewer Cannot Create Task
        console.log('Test 9: Viewer attempts to create a task (should fail with 403)');
        const t9 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/tasks`, token: viewerToken,
          body: { title: 'Viewer trying to add task', priority: 'Low' }
        });
        console.log(`Status: ${t9.statusCode}, Message: "${t9.body.message}"`);
        if (t9.statusCode !== 403) throw new Error(`Expected 403 Forbidden for Viewer, got ${t9.statusCode}`);
        console.log('Viewer mutation privilege restriction verified ✅');
        console.log('✅ Test 9 Passed!\n');

        // ── TEST 10: Role Privilege Enforcement - Viewer CAN View Tasks ───
        console.log('Test 10: Viewer reads tasks list (should succeed with 200)');
        const t10 = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/tasks`, token: viewerToken
        });
        console.log(`Status: ${t10.statusCode}, Count: ${t10.body.data.tasks.length}`);
        if (t10.statusCode !== 200 || t10.body.data.tasks.length < 1) {
          throw new Error('Viewer should be able to read tasks');
        }
        console.log('Viewer read access verified ✅');
        console.log('✅ Test 10 Passed!\n');

        // ── TEST 11: Role Privilege Enforcement - Editor CAN Create Task ──
        console.log('Test 11: Editor creates a second task (should succeed with 201)');
        const t11 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/tasks`, token: editorToken,
          body: {
            title: 'Schedule moving truck inspection',
            priority: 'Urgent',
            assignedTo: editorId
          }
        });
        console.log(`Status: ${t11.statusCode}`);
        if (t11.statusCode !== 201) throw new Error('Editor should be able to create tasks');
        taskId2 = t11.body.data._id;
        console.log(`Editor created task: ${taskId2} ✅`);
        console.log('✅ Test 11 Passed!\n');

        // ── TEST 12: Member Task Statistics Count ─────────────────────────
        console.log('Test 12: Check member taskStats reflecting 2 assigned tasks');
        const t12 = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/members`, token: ownerToken
        });
        const editorStats = t12.body.data.find(m => m.user._id.toString() === editorId).taskStats;
        console.log(`Editor task stats: ${JSON.stringify(editorStats)}`);
        if (editorStats.totalTasks !== 2 || editorStats.pendingTasks !== 2 || editorStats.completionRate !== 0) {
          throw new Error(`Unexpected task stats: ${JSON.stringify(editorStats)}`);
        }
        console.log('Task statistics accurately calculated ✅');
        console.log('✅ Test 12 Passed!\n');

        // ── TEST 13: Task Completion Updates Metrics ──────────────────────
        console.log('Test 13: Complete 1 task and verify completion rate updates to 50%');
        const t13a = await sendRequest({
          method: 'PATCH', path: `/api/v1/tasks/${taskId1}`, token: editorToken,
          body: { status: 'Completed' }
        });
        if (t13a.statusCode !== 200) throw new Error('Task completion update failed');

        const t13b = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/members`, token: ownerToken
        });
        const updatedStats = t13b.body.data.find(m => m.user._id.toString() === editorId).taskStats;
        console.log(`Updated editor task stats: ${JSON.stringify(updatedStats)}`);
        if (updatedStats.completedTasks !== 1 || updatedStats.completionRate !== 50) {
          throw new Error(`Expected completionRate 50%, got ${updatedStats.completionRate}%`);
        }
        console.log('Completion rate accurately recalculated (50%) ✅');
        console.log('✅ Test 13 Passed!\n');

        // ── TEST 14: Protect Owner from Role Downgrade ────────────────────
        console.log('Test 14: PATCH /api/v1/moves/:moveId/members/:memberId (Protect Owner)');
        const t14 = await sendRequest({
          method: 'PATCH', path: `/api/v1/moves/${moveId}/members/${ownerMemberId}`, token: ownerToken,
          body: { role: 'Viewer' }
        });
        console.log(`Status: ${t14.statusCode}, Message: "${t14.body.message}"`);
        if (t14.statusCode !== 400) throw new Error(`Expected 400 protecting Owner, got ${t14.statusCode}`);
        console.log('Owner role downgrade blocked correctly ✅');
        console.log('✅ Test 14 Passed!\n');

        // ── TEST 15: Update Member Role (Editor -> Viewer) ────────────────
        console.log('Test 15: PATCH member role (Editor -> Viewer)');
        const t15 = await sendRequest({
          method: 'PATCH', path: `/api/v1/moves/${moveId}/members/${editorMemberId}`, token: ownerToken,
          body: { role: 'Viewer' }
        });
        console.log(`Status: ${t15.statusCode}`);
        if (t15.statusCode !== 200 || t15.body.data.role !== 'Viewer') {
          throw new Error('Member role update to Viewer failed');
        }
        console.log(`Editor's role changed to: ${t15.body.data.role} ✅`);
        console.log('✅ Test 15 Passed!\n');

        // ── TEST 16: Verify Role Downgrade Takes Effect ───────────────────
        console.log('Test 16: Downgraded user tries to create task (should fail with 403)');
        const t16 = await sendRequest({
          method: 'POST', path: `/api/v1/moves/${moveId}/tasks`, token: editorToken,
          body: { title: 'Should fail after downgrade', priority: 'Low' }
        });
        console.log(`Status: ${t16.statusCode}, Message: "${t16.body.message}"`);
        if (t16.statusCode !== 403) throw new Error(`Expected 403 after role downgrade, got ${t16.statusCode}`);
        console.log('Downgraded user correctly barred from editor actions ✅');
        console.log('✅ Test 16 Passed!\n');

        // ── TEST 17: Protect Owner from Removal ───────────────────────────
        console.log('Test 17: DELETE /api/v1/moves/:moveId/members/:memberId (Protect Owner from removal)');
        const t17 = await sendRequest({
          method: 'DELETE', path: `/api/v1/moves/${moveId}/members/${ownerMemberId}`, token: ownerToken
        });
        console.log(`Status: ${t17.statusCode}, Message: "${t17.body.message}"`);
        if (t17.statusCode !== 400) throw new Error(`Expected 400 protecting Owner from removal, got ${t17.statusCode}`);
        console.log('Owner removal blocked correctly ✅');
        console.log('✅ Test 17 Passed!\n');

        // ── TEST 18: Remove Member & Auto-Unassign Tasks ───────────────────
        console.log('Test 18: DELETE member & verify tasks automatically unassigned');
        const t18 = await sendRequest({
          method: 'DELETE', path: `/api/v1/moves/${moveId}/members/${editorMemberId}`, token: ownerToken
        });
        console.log(`Status: ${t18.statusCode}`);
        if (t18.statusCode !== 200 || !t18.body.data.removed) throw new Error('Member removal failed');

        // Verify tasks assigned to editor are now unassigned (assignedTo === null)
        const checkTask = await Task.findById(taskId2);
        if (checkTask.assignedTo !== null) {
          throw new Error(`Expected assignedTo: null after member removed, got ${checkTask.assignedTo}`);
        }
        console.log('Member removed and associated tasks unassigned (assignedTo: null) ✅');
        console.log('✅ Test 18 Passed!\n');

        // ── TEST 19: Non-Member Access Rejection ──────────────────────────
        console.log('Test 19: StrangerUser attempts to list members (should fail with 403)');
        const t19 = await sendRequest({
          method: 'GET', path: `/api/v1/moves/${moveId}/members`, token: strangerToken
        });
        console.log(`Status: ${t19.statusCode}, Message: "${t19.body.message}"`);
        if (t19.statusCode !== 403) throw new Error(`Expected 403 for stranger, got ${t19.statusCode}`);
        console.log('Non-member multi-tenant boundary verified ✅');
        console.log('✅ Test 19 Passed!\n');

        // ── TEST 20: Audit ActivityLog Entries for Collaboration ──────────
        console.log('Test 20: Verify ActivityLog entries for collaboration operations');
        const logs = await ActivityLog.find({ moveId }).sort('-createdAt');
        const actions = logs.map(l => l.action);
        console.log(`Recorded actions: ${actions.join(', ')}`);

        const expected = ['MEMBER_REMOVED', 'MEMBER_ROLE_UPDATED', 'MEMBER_INVITED'];
        const hasAll = expected.every(a => actions.includes(a));
        if (!hasAll) throw new Error(`Missing expected activity logs. Expected: ${expected.join(', ')}`);
        expected.forEach(a => console.log(`  - ${a}: ✅`));
        console.log('✅ Test 20 Passed!\n');

        // ── Cleanup ───────────────────────────────────────────────────────
        console.log('Cleaning up Phase 7 test data...');
        await Move.findByIdAndDelete(moveId);
        await MoveMember.deleteMany({ moveId });
        await Task.deleteMany({ moveId });
        await ActivityLog.deleteMany({ moveId });
        await User.deleteMany({ _id: { $in: [ownerId, editorId, viewerId, strangerId] } });
        console.log('All test data cleaned up.');

        console.log('\n🎉 ALL PHASE 7 RESPONSIBILITIES & COLLABORATION TESTS PASSED SUCCESSFULLY!');
        server.close(async () => { await disconnectDB(); process.exit(0); });

      } catch (innerErr) {
        console.error('❌ Test assertion error:', innerErr.message);
        try {
          if (moveId) {
            await MoveMember.deleteMany({ moveId });
            await Task.deleteMany({ moveId });
            await ActivityLog.deleteMany({ moveId });
            await Move.findByIdAndDelete(moveId);
          }
          await User.deleteMany({ _id: { $in: [ownerId, editorId, viewerId, strangerId] } });
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

runPhase7Tests();
