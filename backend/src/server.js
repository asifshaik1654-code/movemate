const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/database');

let server;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  server = app.listen(env.PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 MoveMate Server is running in ${env.NODE_ENV} mode`);
    console.log(`📡 URL: http://localhost:${env.PORT}`);
    console.log(`🩺 Health check: http://localhost:${env.PORT}/api/v1/health`);
    console.log(`===============================================`);
  });
};

// Graceful shutdown handler
const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down MoveMate server gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('🔒 HTTP server closed.');
      await disconnectDB();
      console.log('👋 Process terminated cleanly.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, consider graceful shutdown if critical
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception thrown:', error);
  process.exit(1);
});

startServer();

