const User = require('../..//models/userModel');
const ServicePlan = require('../../models/servicePlanmodel');
const { default: axios } = require("axios");

const getReport = async (req, res) => {
  try {
    const users = await User.find({ 'plan.planId': { $ne: null } })
      .populate('plan.planId', 'name services')
      .select('name email mobileNumber plan walletBalance status');

    const reportData = users.map((user) => ({
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      planName: user.plan.planId.name,
      planType: user.plan.planType,
      startDate: user.plan.startDate,
      endDate: user.plan.endDate,
      status: user.status,
    }));

    res.status(200).json({ report: reportData });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { getReport };
