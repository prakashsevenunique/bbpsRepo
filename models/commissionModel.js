const mongoose = require('mongoose');

const CommissionPackageSchema = new mongoose.Schema({
  userId: String,
  packageName: String,
  serviceType: { type: String, enum: ['Payout', 'Payin', 'Money Transfer'] },
  minAmount: String,
  maxAmount: String,
  charges: { type: String, required: false },
  commission: { type: String, required: false },
  distributorCommission: { type: String, required: false },
  gst: { type: String, required: false },
  tds: { type: String, required: false },
  type: { type: String, enum: ['percentage', 'flat'], required: false }
});

const commission = mongoose.model('Commission', CommissionPackageSchema);
module.exports = commission;
