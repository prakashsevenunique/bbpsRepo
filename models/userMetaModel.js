const mongoose = require('mongoose');

const userMetaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  ipWhitelist: {
    type: [String],
    default: [],
  },
  services: [
    {
      serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
      },
      serviceName: {
        type: String,
        required: false
      },
      switch: {
        type: String,
        required: true,
        enum: ['billAwene', 'spritVerify', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'],
        default: 'spritVerify'
      }
    }
  ],
  preferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserMeta', userMetaSchema);