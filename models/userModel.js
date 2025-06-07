const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { format, min } = require('date-fns');

const userSchema = new mongoose.Schema(
  {
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    address: {
      fullAddress: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        default: 'India',
        trim: true,
      }
    },
    pinCode: {
      type: String,
      trim: true,
    },
    isAccountActive: {
      type: Boolean,
      default: false
    },
    documents:[String],
    mpin: {
      type: Number,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[6-9]\d{9}$/,
    },
    isKycVerified: {
      type: Boolean,
      default: false,
    },
    panDetails: {
      type: Object,
      required: false,
    },
    bankDetails: {
      accountHolderName: {
        type: String,
        trim: true
      },
      accountNumber: {
        type: String,
        trim: true
      },
      ifscCode: {
        type: String,
        trim: true
      },
      bankName: {
        type: String,
        trim: true
      },
      branchName: {
        type: String,
        trim: true
      }
    },
    aadharDetails: {
      type: Object,
      required: false,
    },
    role: {
      type: String,
      enum: ['User', 'Retailer', 'Distributor', 'ApiPartner', 'Admin'],
      default: 'User',
    },
    status: {
      type: Boolean,
      default: true,
    },
    commissionPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommissionPackage',
      default: null,
    },
    cappingMoney: {
      type: Number,
      default: 0,
    },
    mainWallet: {
      type: Number,
      default: 0,
      min: 0,
    },
    eWallet: {
      type: Number,
      default: 0,
      min: 0,
    },
    meta: {
      type: Map,
      of: String,
      default: {},
    },
    clientId: {
      type: String,
      unique: true,
      required: true,
      immuable: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
    clientSecret: {
      type: String,
      required: true,
      immuable: true,
      select: false, // Exclude from queries by default
      default: () => crypto.randomBytes(32).toString('hex'),
    }
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);


module.exports = mongoose.model('User', userSchema);
