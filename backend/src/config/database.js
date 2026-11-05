const mongoose = require('mongoose');
const dns = require('dns');
const env = require('./env');

// Configure reliable DNS servers for SRV resolution (fixes Windows querySrv ECONNREFUSED on local ISPs)
if (env.MONGODB_URI && env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (dnsErr) {
    console.warn('DNS server fallback warning:', dnsErr.message);
  }
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  const options = {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
  };

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, options);
    isConnected = true;
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.warn('ℹ️ Running in disconnected state. Provide a valid MONGODB_URI in backend/.env for database operations.');
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('🔄 MongoDB reconnected.');
});

const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('🔌 MongoDB connection closed.');
  }
};

const getDBStatus = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return stateMap[mongoose.connection.readyState] || 'unknown';
};

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus,
  isConnected: () => isConnected,
};

