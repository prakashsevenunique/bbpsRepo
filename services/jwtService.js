const jwt = require('jsonwebtoken');

const generateJwtToken = (userId, role, mobileNumber) => {
  try {
    const payload = {
      id: userId,
      role,
      mobileNumber,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    return token;
  } catch (error) {
    console.error('Error generating JWT:', error);
    throw new Error('Failed to generate token');
  }
};

module.exports = { generateJwtToken };
