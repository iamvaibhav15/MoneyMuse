const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const categoryRoutes = require('./routes/categories');

const app = express();

// -------------------- SECURITY --------------------
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// -------------------- CORS CONFIG --------------------
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:3000';

const corsOptions = {
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight support


// -------------------- RATE LIMITING --------------------
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   message: {
//     success: false,
//     message: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false
// });
// app.use('/api/', limiter);

// -------------------- PARSING --------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// -------------------- STATIC FILES --------------------
const uploadsDir = path.join(__dirname, 'uploads');
const receiptsDir = path.join(uploadsDir, 'receipts');
const pdfDir = path.join(uploadsDir, 'pdfs');

[uploadsDir, receiptsDir, pdfDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
app.use('/uploads', express.static(uploadsDir));

// -------------------- DATABASE CONNECTION --------------------
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personal-finance', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// -------------------- ROUTES --------------------
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);

// -------------------- API DOCUMENTATION --------------------
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Personal Finance Assistant API Documentation',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register with email/password',
        'POST /api/auth/login': 'Login with email/password',
        'POST /api/auth/google': 'Google OAuth authentication',
        'GET /api/auth/me': 'Get current user',
        'PUT /api/auth/profile': 'Update user profile',
        'POST /api/auth/logout': 'Logout user'
      },
      transactions: {
        'GET /api/transactions': 'Get all transactions (with filtering & pagination)',
        'POST /api/transactions': 'Create new transaction (with receipt upload)',
        'POST /api/transactions/import/pdf': 'Bulk import from PDF',
        'GET /api/transactions/:id': 'Get specific transaction',
        'PUT /api/transactions/:id': 'Update transaction',
        'DELETE /api/transactions/:id': 'Delete transaction',
        'GET /api/transactions/stats/summary': 'Get transaction statistics',
        'GET /api/transactions/stats/trends': 'Get spending trends'
      },
      categories: {
        'GET /api/categories': 'Get all categories',
        'POST /api/categories': 'Create new category',
        'PUT /api/categories/:id': 'Update category',
        'DELETE /api/categories/:id': 'Delete category',
        'GET /api/categories/:id/stats': 'Get category statistics'
      }
    }
  });
});

// -------------------- ERROR HANDLING --------------------
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, message: 'Unexpected file field.' });
    }
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(e => e.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

// -------------------- 404 HANDLERS --------------------
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    availableEndpoints: '/api/docs'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// -------------------- SERVER --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ---> https://localhost:${PORT}`);
});

module.exports = app;
