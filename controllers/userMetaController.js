const UserMeta = require("../models/userMetaModel.js");
const mongoose = require("mongoose");

exports.upsertUserMeta = async (req, res) => {
  const { userId, ipWhitelist, services, preferences } = req.body;

  try {
    let userMeta = await UserMeta.findOne({ userId });

    if (!userMeta) {
      userMeta = await UserMeta.create({
        userId,
        ipWhitelist,
        services,
        preferences,
      });
    } else {
      userMeta.ipWhitelist = ipWhitelist || userMeta.ipWhitelist;
      userMeta.preferences = preferences || userMeta.preferences;
      userMeta.services = services || userMeta.services;

      await userMeta.save();
    }

    res.json({ success: true, data: userMeta });
  } catch (err) {
    console.error("Error in upsertUserMeta:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getUserMeta = async (req, res) => {
  try {
    const { userId } = req.params;
    const userMeta = await UserMeta.findOne({ userId }).populate("services.serviceId");

    if (!userMeta) {
      return res.status(404).json({ success: false, message: "UserMeta not found" });
    }

    res.json({ success: true, data: userMeta });
  } catch (err) {
    console.error("Error in getUserMeta:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.removeUserService = async (req, res) => {
  const { userId, serviceId } = req.body;

  try {
    const result = await UserMeta.findOneAndUpdate(
      { userId },
      { $pull: { services: { serviceId: new mongoose.Types.ObjectId(serviceId) } } },
      { new: true }
    );

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error in removeUserService:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getAllUserMeta = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      userId,
      serviceId,
      chargeType,
      ip,
      hasService,       // true or false
      startDate,
      endDate,
    } = req.query;

    const filter = {};
    if (userId) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }

    if (serviceId || chargeType) {
      filter.services = {
        $elemMatch: {
          ...(serviceId && { serviceId: new mongoose.Types.ObjectId(serviceId) }),
          ...(chargeType && { chargeType }),
        },
      };
    }

    if (ip) {
      filter.ipWhitelist = ip;
    }

    if (hasService === "true") {
      filter["services.0"] = { $exists: true };
    } else if (hasService === "false") {
      filter["services"] = { $size: 0 };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await UserMeta.countDocuments(filter);

    const data = await UserMeta.find(filter)
      .populate("services.serviceId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    console.error("Error in getAllUserMeta:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
