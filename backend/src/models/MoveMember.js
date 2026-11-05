const mongoose = require('mongoose');
const { ROLE_LIST, ROLES } = require('../constants/roles');

const moveMemberSchema = new mongoose.Schema(
  {
    moveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Move',
      required: [true, 'Move reference is required'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    role: {
      type: String,
      enum: {
        values: ROLE_LIST,
        message: '{VALUE} is not a valid member role'
      },
      default: ROLES.EDITOR
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring a user is added to a move only once
moveMemberSchema.index({ moveId: 1, userId: 1 }, { unique: true });

const MoveMember = mongoose.model('MoveMember', moveMemberSchema);

module.exports = MoveMember;
