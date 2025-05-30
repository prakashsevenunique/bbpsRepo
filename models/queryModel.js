const mongoose = require("mongoose");

const formSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  regarding: {
    type: String,
    required: true,
    enum: ['Inquiry', 'Support', 'Feedback', 'Complaint', 'Distributor Registration', 'Retailer Registration', 'Other']
  },
  message: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Form = mongoose.model("Form", formSchema);

module.exports = Form;
