const jwt = require("jsonwebtoken");

const generateJwtToken = (userId) => {
  try {
    const token = jwt.sign(
      { userId }, // Payload containing the user's ID
      process.env.JWT_SECRET, // Secret key from `.env`
      { expiresIn: "7d" } // Token expiration time
    );
    return token;
  } catch (error) {
    console.error("Error generating JWT:", error);
    throw new Error("Failed to generate token");
  }
};

module.exports = { generateJwtToken };
