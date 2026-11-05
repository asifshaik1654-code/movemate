const http = require('http');
const app = require('../src/app');

const testPort = 5055;

const makeRequest = (path) => {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${testPort}${path}`, (res) => {
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
    }).on('error', (err) => {
      reject(err);
    });
  });
};

const runTests = async () => {
  console.log('🧪 Starting MoveMate Phase 2 Integration Tests...\n');
  const server = app.listen(testPort, '127.0.0.1', async () => {
    try {
      // Test 1: Root endpoint
      console.log('Test 1: GET / (Root Welcome Endpoint)');
      const rootRes = await makeRequest('/');
      console.log(`Status: ${rootRes.statusCode}`);
      console.log('Response:', JSON.stringify(rootRes.body, null, 2));
      if (rootRes.statusCode !== 200 || !rootRes.body.success) {
        throw new Error('Test 1 Failed: Root endpoint did not return 200 OK');
      }
      console.log('✅ Test 1 Passed!\n');

      // Test 2: Health check endpoint
      console.log('Test 2: GET /api/v1/health (Health Check)');
      const healthRes = await makeRequest('/api/v1/health');
      console.log(`Status: ${healthRes.statusCode}`);
      console.log('Response:', JSON.stringify(healthRes.body, null, 2));
      if (healthRes.statusCode !== 200 || !healthRes.body.success || !healthRes.body.data.version) {
        throw new Error('Test 2 Failed: Health check endpoint did not return expected structure');
      }
      console.log('✅ Test 2 Passed!\n');

      // Test 3: Centralized 404 Error Handler
      console.log('Test 3: GET /api/v1/non-existent-route (404 Error Handling)');
      const notFoundRes = await makeRequest('/api/v1/non-existent-route');
      console.log(`Status: ${notFoundRes.statusCode}`);
      console.log('Response:', JSON.stringify(notFoundRes.body, null, 2));
      if (notFoundRes.statusCode !== 404 || notFoundRes.body.success !== false) {
        throw new Error('Test 3 Failed: Undefined route did not trigger 404 ApiError');
      }
      console.log('✅ Test 3 Passed!\n');

      // Test 4: Security Headers (Helmet)
      console.log('Test 4: Inspect Security Headers (Helmet & CORS)');
      console.log('Content-Security-Policy:', rootRes.headers['content-security-policy'] ? 'Present ✅' : 'Missing ❌');
      console.log('X-Content-Type-Options:', rootRes.headers['x-content-type-options']);
      console.log('X-Frame-Options:', rootRes.headers['x-frame-options']);
      if (!rootRes.headers['x-content-type-options']) {
        throw new Error('Test 4 Failed: Helmet security headers missing');
      }
      console.log('✅ Test 4 Passed!\n');

      console.log('🎉 ALL PHASE 2 TESTS PASSED SUCCESSFULLY!');
      server.close(() => {
        process.exit(0);
      });
    } catch (error) {
      console.error('❌ Test execution error:', error);
      server.close(() => {
        process.exit(1);
      });
    }
  });
};

runTests();
