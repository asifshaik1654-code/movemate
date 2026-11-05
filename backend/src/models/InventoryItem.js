const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    moveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Move',
      required: [true, 'Item must belong to a moving plan'],
      index: true
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Item must be associated with a room'],
      index: true
    },
    boxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Box',
      default: null,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide an item name'],
      trim: true,
      minlength: [2, 'Item name must be at least 2 characters long'],
      maxlength: [100, 'Item name cannot exceed 100 characters'],
      index: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1']
    },
    isFragile: {
      type: Boolean,
      default: false
    },
    isPacked: {
      type: Boolean,
      default: false,
      index: true
    },
    estimatedValue: {
      type: Number,
      default: 0,
      min: [0, 'Estimated value cannot be negative']
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

inventoryItemSchema.index({ moveId: 1, isPacked: 1 });
inventoryItemSchema.index({ roomId: 1, isPacked: 1 });

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

module.exports = InventoryItem;
