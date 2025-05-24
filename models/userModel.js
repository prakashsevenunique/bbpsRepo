const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { format } = require('date-fns');

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
    mpin: {
      type: Number,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[6-9]\d{9}$/, // for Indian 10-digit mobile numbers
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
      type: Object,
      required: false,
    },
    aadharDetails: {
      type: Object,
      required: false,
    },
    role: {
      type: String,
      enum: ['User', 'Retailer', 'Distributor', 'Admin'],
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
    clientId: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
    clientSecret: {
      type: String,
      required: true,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    apiToken: {
      type: String,
      unique: true,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

userSchema.path('createdAt').get(function (val) {
  return format(val, 'MMM dd, yyyy h:mma');
});

userSchema.path('updatedAt').get(function (val) {
  return format(val, 'MMM dd, yyyy h:mma');
});

userSchema.methods.generateApiToken = function () {
  const payload = {
    sub: this._id.toString(),
    clientId: this.clientId,
  };
  const options = {
    algorithm: 'HS256',
  };
  const token = jwt.sign(payload, this.clientSecret, options);
  this.apiToken = token;
  return token;
};

module.exports = mongoose.model('User', userSchema);
