const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/database');
const User = require('../src/models/User');

const testPort = 5056;

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

const runAuthTests = async () => {
  console.log('🧪 Starting Phase 4 Authentication & Security Integration Tests...\n');

  let server;
  const uniqueId = Date.now();
  const testUser = {
    name: 'Alice Moving',
    email: `alice_${uniqueId}@movemate.test`,
    password: 'SecurePassword123!',
    phone: '+15551234567'
  };

  try {
    await connectDB();

    server = app.listen(testPort, '127.0.0.1', async () => {
      try {
        // --- Test 1: Register with valid data ---
        console.log('Test 1: POST /api/v1/auth/register (Valid registration)');
        const regRes = await sendRequest({
          method: 'POST',
          path: '/api/v1/auth/register',
          body: testUser
        });

        console.log(`Status: ${regRes.statusCode}`);
        if (regRes.statusCode !== 201) {
          throw new Error(`Registration failed: ${JSON.stringify(regRes.body)}`);
        }
        if (!regRes.body.data.token || !regRes.body.data.user) {
          throw new Error('Registration did not return user and token');
        }
        if (regRes.body.data.user.password) {
          throw new Error('SECURITY VIOLATION: Password hash leaked in registration response!');
        }
        const authToken = regRes.body.data.token;
        const createdUserId = regRes.body.data.user._id;
        console.log('User registered with ID:', createdUserId);
        console.log('Password excluded from response: ✅');
        console.log('JWT Token issued: ✅');
        console.log('✅ Test 1 Passed!\n');

        // --- Test 2: Register duplicate email ---
        console.log('Test 2: POST /api/v1/auth/register (Duplicate email rejection)');
        const dupRes = await sendRequest({
          method: 'POST',
          path: '/api/v1/auth/register',
          body: testUser
        });

        console.log(`Status: ${dupRes.statusCode}`);
        if (dupRes.statusCode !== 409 || dupRes.body.success !== false) {
          throw new Error(`Expected 409 Conflict for duplicate email, got ${dupRes.statusCode}`);
        }
        console.log('Expected conflict message:', dupRes.body.message);
        console.log('✅ Test 2 Passed!\n');

        // --- Test 3: Validation errors on bad input ---
        console.log('Test 3: POST /api/v1/auth/register (Validation schema enforcement)');
        const invalidRes = await sendRequest({
          method: 'POST',
          path: '/api/v1/auth/register',
          body: {
            name: 'A',
            email: 'bad-email',
            password: 'short'
          }
        });

        console.log(`Status: ${invalidRes.statusCode}`);
        if (invalidRes.statusCode !== 400 || !invalidRes.body.errors) {
          throw new Error('Expected 400 Bad Request with validation errors list');
        }
        console.log(`Caught ${invalidRes.body.errors.length} validation errors:`);
        invalidRes.body.errors.forEach((err) => console.log(` - ${err.field}: ${err.message}`));
        console.log('✅ Test 3 Passed!\n');

        // --- Test 4: Login with valid credentials ---
        console.log('Test 4: POST /api/v1/auth/login (Successful authentication)');
        const loginRes = await sendRequest({
          method: 'POST',
          path: '/api/v1/auth/login',
          body: {
            email: testUser.email,
            password: testUser.password
          }
        });

        console.log(`Status: ${loginRes.statusCode}`);
        if (loginRes.statusCode !== 200 || !loginRes.body.data.token) {
          throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
        }
        if (loginRes.body.data.user.password) {
          throw new Error('SECURITY VIOLATION: Password hash leaked in login response!');
        }
        console.log('Login successful, token refreshed: ✅');
        console.log('✅ Test 4 Passed!\n');

        // --- Test 5: Login with wrong password ---
        console.log('Test 5: POST /api/v1/auth/login (Invalid password)');
        const wrongPassRes = await sendRequest({
          method: 'POST',
          path: '/api/v1/auth/login',
          body: {
            email: testUser.email,
            password: 'WrongPassword999!'
          }
        });

        console.log(`Status: ${wrongPassRes.statusCode}`);
        if (wrongPassRes.statusCode !== 401) {
          throw new Error(`Expected 401 Unauthorized, got ${wrongPassRes.statusCode}`);
        }
        console.log('Expected error message:', wrongPassRes.body.message);
        console.log('✅ Test 5 Passed!\n');

        // --- Test 6: Access protected /auth/me without token ---
        console.log('Test 6: GET /api/v1/auth/me (Missing token)');
        const noTokenRes = await sendRequest({
          method: 'GET',
          path: '/api/v1/auth/me'
        });

        console.log(`Status: ${noTokenRes.statusCode}`);
        if (noTokenRes.statusCode !== 401) {
          throw new Error(`Expected 401 Unauthorized for missing token, got ${noTokenRes.statusCode}`);
        }
        console.log('Expected error message:', noTokenRes.body.message);
        console.log('✅ Test 6 Passed!\n');

        // --- Test 7: Access protected /auth/me with invalid token ---
        console.log('Test 7: GET /api/v1/auth/me (Invalid token)');
        const badTokenRes = await sendRequest({
          method: 'GET',
          path: '/api/v1/auth/me',
          token: 'invalid.tampered.token'
        });

        console.log(`Status: ${badTokenRes.statusCode}`);
        if (badTokenRes.statusCode !== 401) {
          throw new Error(`Expected 401 Unauthorized for invalid token, got ${badTokenRes.statusCode}`);
        }
        console.log('Expected error message:', badTokenRes.body.message);
        console.log('✅ Test 7 Passed!\n');

        // --- Test 8: Access protected /auth/me with valid token ---
        console.log('Test 8: GET /api/v1/auth/me (Valid Bearer token)');
        const meRes = await sendRequest({
          method: 'GET',
          path: '/api/v1/auth/me',
          token: authToken
        });

        console.log(`Status: ${meRes.statusCode}`);
        if (meRes.statusCode !== 200 || !meRes.body.data._id) {
          throw new Error(`Failed to get profile: ${JSON.stringify(meRes.body)}`);
        }
        if (meRes.body.data.email !== testUser.email) {
          throw new Error('Profile email does not match registered user');
        }
        if (meRes.body.data.password) {
          throw new Error('SECURITY VIOLATION: Password hash leaked in profile response!');
        }
        console.log('Profile retrieved for:', meRes.body.data.name, `<${meRes.body.data.email}>`);
        console.log('✅ Test 8 Passed!\n');

        // --- Clean up test user ---
        console.log('Cleaning up test user from MongoDB Atlas...');
        await User.findByIdAndDelete(createdUserId);
        console.log('Test user cleaned up successfully.');

        console.log('\n🎉 ALL PHASE 4 AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
        server.close(async () => {
          await disconnectDB();
          process.exit(0);
        });
      } catch (innerErr) {
        console.error('❌ Integration test assertion error:', innerErr.message);
        // Attempt clean up
        await User.deleteOne({ email: testUser.email });
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

runAuthTests();
