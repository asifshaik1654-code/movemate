const mongoose = require('mongoose');
const { TASK_STATUSES, TASK_PRIORITIES } = require('../constants/statuses');

const taskSchema = new mongoose.Schema(
  {
    moveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Move',
      required: [true, 'Task must belong to a moving plan'],
      index: true
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      minlength: [3, 'Task title must be at least 3 characters long'],
      maxlength: [150, 'Task title cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: TASK_STATUSES,
        message: '{VALUE} is not a valid task status'
      },
      default: 'Pending',
      index: true
    },
    priority: {
      type: String,
      enum: {
        values: TASK_PRIORITIES,
        message: '{VALUE} is not a valid task priority'
      },
      default: 'Medium',
      index: true
    },
    dueDate: {
      type: Date,
      default: null,
      index: true
    },
    isEssential: {
      type: Boolean,
      default: false,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for common queries
taskSchema.index({ moveId: 1, status: 1 });
taskSchema.index({ moveId: 1, isEssential: 1 });
taskSchema.index({ moveId: 1, dueDate: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

