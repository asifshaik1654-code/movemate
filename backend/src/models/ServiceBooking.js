const mongoose = require('mongoose');
const { SERVICE_TYPES, SERVICE_STATUSES } = require('../constants/statuses');

const serviceBookingSchema = new mongoose.Schema(
  {
    moveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Move',
      required: [true, 'Service booking must belong to a moving plan'],
      index: true
    },
    serviceType: {
      type: String,
      required: [true, 'Service type is required (e.g., Electricity Transfer, Movers)'],
      enum: {
        values: SERVICE_TYPES,
        message: '{VALUE} is not a valid service type'
      },
      index: true
    },
    providerName: {
      type: String,
      required: [true, 'Provider or utility company name is required'],
      trim: true,
      minlength: [2, 'Provider name must be at least 2 characters long'],
      maxlength: [100, 'Provider name cannot exceed 100 characters']
    },
    contactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: SERVICE_STATUSES,
        message: '{VALUE} is not a valid booking status'
      },
      default: 'Booked',
      index: true
    },
    confirmationNumber: {
      type: String,
      trim: true,
      default: ''
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative']
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

serviceBookingSchema.index({ moveId: 1, scheduledDate: 1 });
serviceBookingSchema.index({ moveId: 1, status: 1 });

const ServiceBooking = mongoose.model('ServiceBooking', serviceBookingSchema);

module.exports = ServiceBooking;
