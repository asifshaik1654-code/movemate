const mongoose = require('mongoose');
const { EXPENSE_CATEGORIES } = require('../constants/statuses');

const expenseSchema = new mongoose.Schema(
  {
    moveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Move',
      required: [true, 'Expense must belong to a moving plan'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      enum: {
        values: EXPENSE_CATEGORIES,
        message: '{VALUE} is not a valid expense category'
      },
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide an expense title'],
      trim: true,
      minlength: [2, 'Expense title must be at least 2 characters long'],
      maxlength: [100, 'Expense title cannot exceed 100 characters']
    },
    estimatedCost: {
      type: Number,
      required: [true, 'Estimated cost is required'],
      min: [0, 'Estimated cost cannot be negative']
    },
    actualCost: {
      type: Number,
      default: 0,
      min: [0, 'Actual cost cannot be negative']
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    receiptUrl: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

expenseSchema.index({ moveId: 1, category: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
