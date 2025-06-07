const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      required: true,
    },
    serviceFor: {
      type: [String],
      enum: ['User', 'Retailer', 'Distributor', 'ApiPartner', 'Admin'],
      required: true,
    },
    defaultSwitch: {
      type: String,
      enum: ['billAwene', 'spritVerify', 'Mobikwik', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'],
      required: true,
      default: 'spritVerify',
    },
    providers: [
      {
        providerName: {
          type: String,
          enum: ['billAwene', 'spritVerify', 'serverMaintenance', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'],
          required: true,
          default: 'spritVerify'
        },
        chargeType: {
          type: String,
          enum: ['fixed', 'percentage'],
          required: true,
          default: 'fixed'
        },
        serviceCharges: {
          type: Number,
          required: true,
          min: 0,
        },
        distributorCommission: {
          type: Number,
          required: true,
          min: 0,
        },
        gst: {
          type: Number,
          required: true,
          min: 0,
        }
      }
    ],
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Service', serviceSchema);
