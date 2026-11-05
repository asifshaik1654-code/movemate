const mongoose = require('mongoose');
const env = require('../src/config/env');
const { connectDB, disconnectDB, getDBStatus } = require('../src/config/database');

const testConnection = async () => {
  console.log('🧪 Testing MongoDB connection with MoveMate configuration...');
  
  try {
    const conn = await connectDB();
    if (!conn) {
      console.error('❌ Connection returned null. Please check your MONGODB_URI in backend/.env');
      process.exit(1);
    }

    const state = getDBStatus();
    console.log(`📡 Current Database State: ${state}`);
    console.log(`🌐 Connected Host: ${conn.connection.host}`);
    console.log(`📁 Database Name: ${conn.connection.name}`);

    // Test a basic ping command
    const pingResult = await mongoose.connection.db.admin().ping();
    console.log('📶 MongoDB Admin Ping:', pingResult.ok === 1 ? 'SUCCESS (Cluster responding)' : 'FAILED');

    await disconnectDB();
    console.log('✅ MongoDB connection verified and gracefully closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB Connection Test Failed:', error.message);
    process.exit(1);
  }
};

testConnection();
