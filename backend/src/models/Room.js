const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    moveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Move',
      required: [true, 'Room must belong to a moving plan'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide a room name (e.g., Living Room, Kitchen)'],
      trim: true,
      minlength: [2, 'Room name must be at least 2 characters long'],
      maxlength: [50, 'Room name cannot exceed 50 characters']
    },
    floor: {
      type: String,
      trim: true,
      default: ''
    },
    colorCode: {
      type: String,
      trim: true,
      default: '#3B82F6' // Default calm blue
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring room names are unique within a move
roomSchema.index({ moveId: 1, name: 1 }, { unique: true });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;

