const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/database');
const { User, Move, Task, ActivityLog } = require('../src/models');

const testPort = 5057;

const sendRequest = ({ method, path, body = null, token = null }) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const headers = {
      'Content-Type': 'application/json'
    };
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: '127.0.0.1',
      port: testPort,
      path,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

const runMovesTasksTests = async () => {
  console.log('🧪 Starting Phase 5 Move & Task Management Integration Tests...\n');

  let server;
  const uniqueId = Date.now();

  try {
    await connectDB();

    server = app.listen(testPort, '127.0.0.1', async () => {
      let userAToken, userBToken, userAId, userBId;
      let createdMoveId, createdTaskId;

      try {
        // --- Setup: Register User A and User B ---
        console.log('Setup: Register User A and User B for multi-tenant isolation testing');
        const regA = await sendRequest({
          method: 'POST',
          path: '/api/v1/auth/register',
          body: {
            name: 'User A Owner',
            email: `usera_${uniqueId}@movemate.test`,
            password: 'Password123!'
          }
        });
        userAToken = regA.body.data.token;
        userAId = regA.body.data.user._id;

        const regB = await sendRequest({
          method: 'POST',
          path: '/api/v1/auth/register',
          body: {
            name: 'User B Stranger',
            email: `userb_${uniqueId}@movemate.test`,
            password: 'Password123!'
          }
        });
        userBToken = regB.body.data.token;
        userBId = regB.body.data.user._id;
        console.log('Registered User A and User B: ✅\n');

        // --- Test 1: User A Creates a Moving Plan ---
        console.log('Test 1: POST /api/v1/moves (Create Moving Plan)');
        const createMoveRes = await sendRequest({
          method: 'POST',
          path: '/api/v1/moves',
          token: userAToken,
          body: {
            title: 'Downtown to Green Suburbs',
            currentAddress: '123 Market St, Apt 4B',
            destinationAddress: '789 Oak Tree Lane',
            moveDate: '2026-12-15T09:00:00.000Z',
            notes: 'Reserve elevator for moving truck'
          }
        });

        console.log(`Status: ${createMoveRes.statusCode}`);
        if (createMoveRes.statusCode !== 201 || !createMoveRes.body.data._id) {
          throw new Error(`Failed to create move: ${JSON.stringify(createMoveRes.body)}`);
        }
        createdMoveId = createMoveRes.body.data._id;
        console.log('Created Move ID:', createdMoveId);
        console.log('✅ Test 1 Passed!\n');

        // --- Test 2: User A Lists Their Moves ---
        console.log('Test 2: GET /api/v1/moves (List User Moves)');
        const getMovesRes = await sendRequest({
          method: 'GET',
          path: '/api/v1/moves?status=Planning',
          token: userAToken
        });

        console.log(`Status: ${getMovesRes.statusCode}`);
        if (getMovesRes.statusCode !== 200 || !getMovesRes.body.data.moves) {
          throw new Error('Failed to retrieve moves list');
        }
        const userMoves = getMovesRes.body.data.moves;
        if (userMoves.length === 0 || userMoves[0]._id !== createdMoveId) {
          throw new Error('Expected created move in list');
        }
        console.log(`Retrieved ${userMoves.length} moves, userRole: ${userMoves[0].userRole}`);
        console.log('✅ Test 2 Passed!\n');

        // --- Test 3: Multi-tenant Isolation - User B attempts to access User A's move ---
        console.log('Test 3: GET /api/v1/moves/:moveId (Unauthorized access prevention)');
        const unauthRes = await sendRequest({
          method: 'GET',
          path: `/api/v1/moves/${createdMoveId}`,
          token: userBToken
        });

        console.log(`Status: ${unauthRes.statusCode}`);
        if (unauthRes.statusCode !== 403) {
          throw new Error(`Expected 403 Forbidden for unauthorized user, got ${unauthRes.statusCode}`);
        }
        console.log('Expected forbidden message:', unauthRes.body.message);
        console.log('✅ Test 3 Passed!\n');

        // --- Test 4: Update Move Details ---
        console.log('Test 4: PATCH /api/v1/moves/:moveId (Update move)');
        const updateMoveRes = await sendRequest({
          method: 'PATCH',
          path: `/api/v1/moves/${createdMoveId}`,
          token: userAToken,
          body: {
            title: 'Downtown to Sunny Suburbs Updated',
            status: 'In Progress'
          }
        });

        console.log(`Status: ${updateMoveRes.statusCode}`);
        if (updateMoveRes.statusCode !== 200 || updateMoveRes.body.data.status !== 'In Progress') {
          throw new Error('Failed to update move status');
        }
        console.log('Updated title:', updateMoveRes.body.data.title);
        console.log('✅ Test 4 Passed!\n');

        // --- Test 5: Create Tasks (Normal, Essential, and Overdue) ---
        console.log('Test 5: POST /api/v1/moves/:moveId/tasks (Create Tasks)');
        // 5a. Regular Task
        const task1Res = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${createdMoveId}/tasks`,
          token: userAToken,
          body: {
            title: 'Collect spare boxes from grocery store',
            priority: 'Low',
            isEssential: false,
            dueDate: '2026-12-01T12:00:00.000Z'
          }
        });
        if (task1Res.statusCode !== 201) throw new Error('Failed to create Task 1');

        // 5b. Essential Task
        const task2Res = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${createdMoveId}/tasks`,
          token: userAToken,
          body: {
            title: 'Return house keys to leasing office',
            priority: 'High',
            isEssential: true,
            dueDate: '2026-12-14T17:00:00.000Z',
            assignedTo: userAId
          }
        });
        if (task2Res.statusCode !== 201) throw new Error('Failed to create Task 2');
        createdTaskId = task2Res.body.data._id;

        // 5c. Overdue Task (Due in the past)
        const overdueTaskRes = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${createdMoveId}/tasks`,
          token: userAToken,
          body: {
            title: 'Give 30-day notice to landlord',
            priority: 'Urgent',
            isEssential: true,
            dueDate: '2026-10-01T00:00:00.000Z' // Past date!
          }
        });
        if (overdueTaskRes.statusCode !== 201) throw new Error('Failed to create Overdue Task');

        console.log('Created 3 tasks (Regular, Essential, Overdue): ✅');
        console.log('✅ Test 5 Passed!\n');

        // --- Test 6: Task Assignment Security - Disallow assigning to non-member ---
        console.log('Test 6: POST /api/v1/moves/:moveId/tasks (Assign to unauthorized stranger)');
        const invalidAssignRes = await sendRequest({
          method: 'POST',
          path: `/api/v1/moves/${createdMoveId}/tasks`,
          token: userAToken,
          body: {
            title: 'Unauthorized Task assignment',
            assignedTo: userBId // User B is not a member of Move A!
          }
        });

        console.log(`Status: ${invalidAssignRes.statusCode}`);
        if (invalidAssignRes.statusCode !== 400) {
          throw new Error(`Expected 400 Bad Request for unauthorized assignment, got ${invalidAssignRes.statusCode}`);
        }
        console.log('Expected error caught:', invalidAssignRes.body.message);
        console.log('✅ Test 6 Passed!\n');

        // --- Test 7: Filter Tasks by Overdue Status ---
        console.log('Test 7: GET /api/v1/moves/:moveId/tasks?overdue=true (Overdue detection)');
        const overdueRes = await sendRequest({
          method: 'GET',
          path: `/api/v1/moves/${createdMoveId}/tasks?overdue=true`,
          token: userAToken
        });

        console.log(`Status: ${overdueRes.statusCode}`);
        if (overdueRes.statusCode !== 200 || overdueRes.body.data.tasks.length !== 1) {
          throw new Error(`Expected exactly 1 overdue task, got ${overdueRes.body.data.tasks?.length}`);
        }
        const overdueTask = overdueRes.body.data.tasks[0];
        if (!overdueTask.isOverdue) {
          throw new Error('Expected task isOverdue flag to be true');
        }
        console.log('Overdue task title:', overdueTask.title);
        console.log('Dynamic isOverdue flag verified: ✅');
        console.log('✅ Test 7 Passed!\n');

        // --- Test 8: Filter Tasks by Essential Flag ---
        console.log('Test 8: GET /api/v1/moves/:moveId/tasks?isEssential=true (Essential filter)');
        const essentialRes = await sendRequest({
          method: 'GET',
          path: `/api/v1/moves/${createdMoveId}/tasks?isEssential=true`,
          token: userAToken
        });

        console.log(`Status: ${essentialRes.statusCode}`);
        if (essentialRes.statusCode !== 200 || essentialRes.body.data.tasks.length < 2) {
          throw new Error('Expected at least 2 essential tasks');
        }
        console.log(`Found ${essentialRes.body.data.tasks.length} essential tasks: ✅`);
        console.log('✅ Test 8 Passed!\n');

        // --- Test 9: Update Task Status to Completed ---
        console.log('Test 9: PATCH /api/v1/tasks/:taskId (Mark task complete)');
        const completeTaskRes = await sendRequest({
          method: 'PATCH',
          path: `/api/v1/tasks/${createdTaskId}`,
          token: userAToken,
          body: {
            status: 'Completed'
          }
        });

        console.log(`Status: ${completeTaskRes.statusCode}`);
        if (completeTaskRes.statusCode !== 200 || !completeTaskRes.body.data.completedAt) {
          throw new Error('Expected task completedAt timestamp to be set');
        }
        console.log('Task completedAt timestamp set:', completeTaskRes.body.data.completedAt);
        console.log('✅ Test 9 Passed!\n');

        // --- Test 10: Activity Log Verification ---
        console.log('Test 10: Inspect ActivityLog entries');
        const logs = await ActivityLog.find({ moveId: createdMoveId }).sort('-createdAt');
        console.log(`Recorded ${logs.length} audit logs for this move:`);
        logs.forEach((log) => console.log(` - [${log.action}]: ${log.details}`));
        if (logs.length < 4) {
          throw new Error('Expected at least 4 activity logs');
        }
        console.log('Audit history verified: ✅');
        console.log('✅ Test 10 Passed!\n');

        // --- Test 11: Delete Task ---
        console.log('Test 11: DELETE /api/v1/tasks/:taskId (Delete task)');
        const deleteTaskRes = await sendRequest({
          method: 'DELETE',
          path: `/api/v1/tasks/${createdTaskId}`,
          token: userAToken
        });

        console.log(`Status: ${deleteTaskRes.statusCode}`);
        if (deleteTaskRes.statusCode !== 200) {
          throw new Error('Failed to delete task');
        }
        console.log('Task deleted successfully: ✅');
        console.log('✅ Test 11 Passed!\n');

        // --- Test 12: Delete Move with Cascade Cleanup ---
        console.log('Test 12: DELETE /api/v1/moves/:moveId (Cascade delete move)');
        const deleteMoveRes = await sendRequest({
          method: 'DELETE',
          path: `/api/v1/moves/${createdMoveId}`,
          token: userAToken
        });

        console.log(`Status: ${deleteMoveRes.statusCode}`);
        if (deleteMoveRes.statusCode !== 200) {
          throw new Error('Failed to delete move');
        }
        // Verify child tasks were cleaned up
        const remainingTasks = await Task.countDocuments({ moveId: createdMoveId });
        if (remainingTasks !== 0) {
          throw new Error(`Expected 0 remaining tasks after cascade delete, found ${remainingTasks}`);
        }
        console.log('Move and all child tasks cleaned up cleanly: ✅');
        console.log('✅ Test 12 Passed!\n');

        // Clean up test users
        console.log('Cleaning up test users...');
        await User.deleteMany({ _id: { $in: [userAId, userBId] } });
        console.log('Test users cleaned up.');

        console.log('\n🎉 ALL PHASE 5 MOVE & TASK TESTS PASSED SUCCESSFULLY!');
        server.close(async () => {
          await disconnectDB();
          process.exit(0);
        });
      } catch (innerErr) {
        console.error('❌ Test assertion error:', innerErr.message);
        if (userAId || userBId) {
          await User.deleteMany({ _id: { $in: [userAId, userBId] } });
        }
        if (createdMoveId) {
          await Move.findByIdAndDelete(createdMoveId);
          await Task.deleteMany({ moveId: createdMoveId });
          await ActivityLog.deleteMany({ moveId: createdMoveId });
        }
        server.close(async () => {
          await disconnectDB();
          process.exit(1);
        });
      }
    });
  } catch (err) {
    console.error('❌ Server startup error in tests:', err.message);
    if (server) server.close();
    await disconnectDB();
    process.exit(1);
  }
};

runMovesTasksTests();

