const Plan = require("../../models/servicePlanmodel");
const User = require("../../models/userModel");


exports.getAlluserController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || "";
    const role = req.query.role || "";
    const isKycVerified = req.query.isKycVerified === "true";
    const status = req.query.status ;

    const searchCriteria = searchQuery
      ? {
          $or: [
            { name: { $regex: searchQuery, $options: "i" } },
            { email: { $regex: searchQuery, $options: "i" } },
          ],
        }
      : {};

    if (role) {
      searchCriteria.role = role;
    }

    if (isKycVerified) {
      searchCriteria.isKycVerified = isKycVerified;
    }

    if (status) {
      searchCriteria.status = status;
    }

    const skip = (page - 1) * limit;

    console.log("sdfdghj", searchCriteria);

    const result = await User.find(searchCriteria).skip(skip).limit(limit);

    if (!result || result.length === 0) {
      return res.status(404).send("No users found");
    }

    const totalUsers = await User.countDocuments(searchCriteria);

    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      data: result,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.error("Error in getAlluserController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const XLSX = require("xlsx");

exports.exportUsersToExcel = async (req, res) => {
  try {
    const users = await User.find(); // Sare users fetch karo

    if (!users || users.length === 0) {
      return res.status(404).send("No users found");
    }

    // **Excel File Generate Karna**
    const worksheet = XLSX.utils.json_to_sheet(users.map(user => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      "KYC Verified": user.isKycVerified ? "Yes" : "No",
      Status: user.status,
      CreatedAt: user.createdAt
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    // Excel file ko buffer me save karo
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Response headers set karo taki file download ho
    res.setHeader("Content-Disposition", "attachment; filename=users.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    return res.send(excelBuffer);
  } catch (error) {
    console.error("Error exporting users to Excel:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

