const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      required: [true, 'Icon is required'],
    },
    serviceFor: [
      {
        type: String,
        enum: ['User', 'Retailer', 'Distributor', 'ApiPartner', 'Admin'],
        required: true,
      },
    ],
    serviceBy:{
      type: String,
      enum: ['billAwene', 'spritVerify', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'],
      required: [true, 'Service provider is required'],
    },
    serviceCharges: {
      type: Number,
      required: [true, 'Service charges are required'],
      min: [0, 'Service charges cannot be negative'],
    },
    commission: {
      type: Number,
      required: [true, 'Commission is required'],
      min: [0, 'Commission cannot be negative'],
    },
    distributorCommission: {
      type: Number,
      required: [true, 'Distributor commission is required'],
      min: [0, 'Distributor commission cannot be negative'],
    },
    gst: {
      type: Number,
      required: [true, 'GST is required'],
      min: [0, 'GST cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', serviceSchema);
