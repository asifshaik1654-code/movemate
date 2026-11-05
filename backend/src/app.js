const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const ApiError = require('./utils/apiError');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost origins
    if (env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (origin === env.CLIENT_URL) {
      return callback(null, true);
    }
    
    return callback(new ApiError(403, 'Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate Limiting
app.use('/api', generalLimiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to MoveMate API – Intelligent Home Moving Coordinator',
    version: '1.0.0',
    documentation: '/api/v1/health'
  });
});

// Mount /api/v1 routes
app.use('/api/v1', routes);

// 404 Handler for undefined routes
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found on this server`));
});

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;

