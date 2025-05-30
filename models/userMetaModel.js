const mongoose = require('mongoose')

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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    }
  ],
  preferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('UserMeta', userMetaSchema)
