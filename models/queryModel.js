const mongoose = require("mongoose");

const formSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  number: { type: Number, required: true },
  message: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now }
});

const Form = mongoose.model("Form", formSchema);

module.exports = Form;