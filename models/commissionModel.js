const mongoose = require('mongoose');

const CommissionPackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    user_id:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    commissions: [
      {
        service: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Service',
          required: true,
        },
        commissionType: {
          type: String,
          enum: ['flat', 'percentage'],
          required: true,
        },
        value: {
          type: Number,
          required: true,
        },
        minAmount: {
          type: Number,
        },
        maxAmount: {
          type: Number,
        },
        belowMinAmount: {
          commissionType: {
            type: String,
            enum: ['flat', 'percentage'],
          },
          value: {
            type: Number,
          },
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    remarks: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommissionPackage', CommissionPackageSchema);
