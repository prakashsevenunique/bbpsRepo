const Form = require("../models/queryModel");
const sendEmail = require("../services/queryService");

const submitForm = async (req, res) => {
  try {
    const { fullName, email, number, message } = req.body;

    if (!fullName || !email || !number) {
      return res.status(400).json({ error: "Full name, email, and number are required." });
    }

    // Save form details in MongoDB
    const newForm = new Form({ fullName, email, number, message });
    await newForm.save();

    // Send Email to Office
    await sendEmail({ fullName, email, number, message });

    res.status(201).json({ success: true, message: "Form submitted successfully" });
  } catch (error) {
    console.error("Error submitting form:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { submitForm };