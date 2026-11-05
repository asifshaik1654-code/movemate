const mongoose = require('mongoose');
const { ACTIVITY_ENTITIES } = require('../constants/statuses');

const activityLogSchema = new mongoose.Schema(
  {
    moveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Move',
      required: [true, 'Activity must be linked to a moving plan'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who performed the action is required'],
      index: true
    },
    action: {
      type: String,
      required: [true, 'Action identifier is required'],
      trim: true
    },
    details: {
      type: String,
      required: [true, 'Activity details description is required'],
      trim: true
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: {
        values: ACTIVITY_ENTITIES,
        message: '{VALUE} is not a valid activity entity type'
      }
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

activityLogSchema.index({ moveId: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;

