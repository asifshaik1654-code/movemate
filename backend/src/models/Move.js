const mongoose = require('mongoose');
const { MOVE_STATUSES } = require('../constants/statuses');

const moveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Move must belong to an owner user'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for this moving plan'],
      trim: true,
      minlength: [3, 'Move title must be at least 3 characters long'],
      maxlength: [100, 'Move title cannot exceed 100 characters']
    },
    currentAddress: {
      type: String,
      required: [true, 'Please provide your current address'],
      trim: true
    },
    destinationAddress: {
      type: String,
      required: [true, 'Please provide your destination address'],
      trim: true
    },
    moveDate: {
      type: Date,
      required: [true, 'Please provide a moving date'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: MOVE_STATUSES,
        message: '{VALUE} is not a valid move status'
      },
      default: 'Planning',
      index: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying user moves sorted by moveDate
moveSchema.index({ userId: 1, moveDate: 1 });

const Move = mongoose.model('Move', moveSchema);

module.exports = Move;
