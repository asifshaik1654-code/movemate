const mongoose = require('mongoose');
const { BOX_STATUSES } = require('../constants/statuses');

const boxSchema = new mongoose.Schema(
  {
    moveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Move',
      required: [true, 'Box must belong to a moving plan'],
      index: true
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Box must be assigned to a room'],
      index: true
    },
    boxNumber: {
      type: Number,
      required: [true, 'Box number is required'],
      min: [1, 'Box number must be at least 1']
    },
    boxLabel: {
      type: String,
      required: [true, 'Unique box label is required (e.g., BOX-001)'],
      trim: true,
      uppercase: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isFragile: {
      type: Boolean,
      default: false
    },
    isPriority: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: {
        values: BOX_STATUSES,
        message: '{VALUE} is not a valid box status'
      },
      default: 'Not Started',
      index: true
    },
    qrCodeData: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound unique indexes within a move
boxSchema.index({ moveId: 1, boxLabel: 1 }, { unique: true });
boxSchema.index({ moveId: 1, boxNumber: 1 }, { unique: true });
boxSchema.index({ moveId: 1, status: 1 });
boxSchema.index({ roomId: 1, status: 1 });

const Box = mongoose.model('Box', boxSchema);

module.exports = Box;

