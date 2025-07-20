const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const multer = require('multer');
const ReceiptParser = require('../utils/receiptParser');
const PDFTransactionParser = require('../utils/pdfTransactionParser');

const router = express.Router();

// Get all transactions with filtering and pagination
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['income', 'expense']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('sortBy').optional().isIn(['date', 'amount', 'category', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter
    const filter = { user: req.user._id };
    
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    if (req.query.category) {
      filter.category = { $regex: req.query.category, $options: 'i' };
    }
    
    if (req.query.search) {
      filter.$or = [
        { description: { $regex: req.query.search, $options: 'i' } },
        { category: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }
    
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate);
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});

// Create new transaction
router.post('/', auth, upload.single('receipt'), [
  body('type').isIn(['income', 'expense']),
  body('amount').isFloat({ min: 0.01 }),
  body('category').trim().isLength({ min: 1 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('date').optional().isISO8601(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const transactionData = {
      user: req.user._id,
      type: req.body.type,
      amount: parseFloat(req.body.amount),
      category: req.body.category,
      description: req.body.description || '',
      date: req.body.date ? new Date(req.body.date) : new Date(),
      tags: req.body.tags || []
    };

    // Process receipt if uploaded
    if (req.file) {
      try {
        let extractedData;
        
        if (req.file.mimetype.startsWith('image/')) {
          extractedData = await ReceiptParser.extractFromImage(req.file.path);
        } else if (req.file.mimetype === 'application/pdf') {
          extractedData = await ReceiptParser.extractFromPDF(req.file.path);
        }

        transactionData.receipt = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          extractedData
        };

        // Auto-fill transaction data from receipt if confidence is high
        if (extractedData && extractedData.confidence > 0.7) {
          if (!req.body.description && extractedData.merchant) {
            transactionData.description = extractedData.merchant;
          }
          if (extractedData.total > 0 && Math.abs(extractedData.total - transactionData.amount) < 1) {
            transactionData.amount = extractedData.total;
          }
          if (extractedData.date && !req.body.date) {
            transactionData.date = extractedData.date;
          }
        }
      } catch (receiptError) {
        console.error('Receipt processing error:', receiptError);
        // Continue with transaction creation even if receipt processing fails
        transactionData.receipt = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          extractedData: null
        };
      }
    }

    const transaction = new Transaction(transactionData);
    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating transaction'
    });
  }
});

// Bulk import from PDF
router.post('/import/pdf', auth, (req, res, next) => {
  const uploadMiddleware = upload.single('pdf');
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
}, async (req, res) => {
  var result;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }
    result = await PDFTransactionParser.parseTransactionHistory(req.file.path);
    if (result.transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No transactions found in PDF'
      });
    }

  } catch (error) {
    console.error('PDF import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while importing PDF transactions'
    });
  }
    // Add user ID to all transactions
    const transactionsToInsert = result.transactions.map(t => ({
      ...t,
      user: req.user._id
    }));

    // Insert transactions in bulk
    const insertedTransactions = await Transaction.insertMany(transactionsToInsert);
    res.json({
      success: true,
      message: `Successfully imported ${insertedTransactions.length} transactions`,
      data: {
        imported: insertedTransactions.length,
        confidence: result.confidence,
        transactions: insertedTransactions
      }
    });
});

// Get transaction by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction'
    });
  }
});

// Update transaction
router.put('/:id', auth, [
  body('type').optional().isIn(['income', 'expense']),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('category').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('date').optional().isISO8601(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating transaction'
    });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting transaction'
    });
  }
});

// Get transaction statistics
router.get('/stats/summary', auth, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('groupBy').optional().isIn(['day', 'week', 'month', 'year'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Build date filter
    const dateFilter = { user: req.user._id };
    if (req.query.startDate || req.query.endDate) {
      dateFilter.date = {};
      if (req.query.startDate) {
        dateFilter.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        dateFilter.date.$lte = new Date(req.query.endDate);
      }
    }

    // Aggregate statistics
    const [summary, categoryBreakdown, monthlyTrends, recentTransactions] = await Promise.all([
      // Summary by type
      Transaction.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        }
      ]),

      // Category breakdown
      Transaction.aggregate([
        { $match: { ...dateFilter, type: 'expense' } },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        },
        { $sort: { total: -1 } },
        { $limit: 10 }
      ]),

      // Monthly trends
      Transaction.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              type: '$type'
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      // Recent transactions
      Transaction.find(dateFilter)
        .sort({ date: -1 })
        .limit(5)
        .lean()
    ]);

    // Calculate additional metrics
    const totalIncome = summary.find(s => s._id === 'income')?.total || 0;
    const totalExpenses = summary.find(s => s._id === 'expense')?.total || 0;
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          netIncome,
          savingsRate: Math.round(savingsRate * 100) / 100,
          transactionCount: summary.reduce((acc, s) => acc + s.count, 0)
        },
        categoryBreakdown,
        monthlyTrends,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// Get spending trends
router.get('/stats/trends', auth, [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']),
  query('groupBy').optional().isIn(['day', 'week', 'month'])
], async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const groupBy = req.query.groupBy || 'day';
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    // Build aggregation pipeline
    let groupId;
    switch (groupBy) {
      case 'day':
        groupId = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
        break;
      case 'week':
        groupId = {
          year: { $year: '$date' },
          week: { $week: '$date' }
        };
        break;
      case 'month':
        groupId = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
        break;
    }

    const trends = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { ...groupId, type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        trends,
        period,
        groupBy,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trends'
    });
  }
});

module.exports = router;