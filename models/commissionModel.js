const mongoose = require('mongoose');

const commissionSlabSchema = new mongoose.Schema({
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  commissionType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
  retailer: { type: Number, required: true },
  distributor: { type: Number, required: true },
  admin: { type: Number, default: 0 },
}, { _id: false });

const commissionPackageSchema = new mongoose.Schema({
  service: { type: String, enum: ['DMT', 'AEPS', 'PAYIN', 'PAYOUT'], required: true },
  packageName: { type: String, required: true, unique: true },
  gst: { type: Number, default: 18 },
  tds: { type: Number, default: 5 },
  slabs: [commissionSlabSchema],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true 
});

module.exports = mongoose.model('CommissionPackage', commissionPackageSchema);
