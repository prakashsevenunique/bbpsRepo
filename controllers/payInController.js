const User = require("../models/userModel.js");
const mongoose = require("mongoose");
const PayIn = require("../models/payInModel.js"); // Renamed to match model convention
const axios = require("axios");
const { parse } = require('json2csv');


exports.allPayin = async (req, res, next) => {
  try {
    const {
      keyword,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      exportCsv = 'false'
    } = req.query;

    const match = {};

    const userId = req.user.role == "Admin" ? req.query.userId : req.user?.id;

    if (keyword) {
      match.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { mobile: parseInt(keyword) || 0 }, // Try to match mobile as number
        { reference: { $regex: keyword, $options: 'i' } }
      ];
    }
    if (userId) match.user_id = new mongoose.Types.ObjectId(userId);

    if (status) match.status = status;

    if (fromDate || toDate) {
      match.createdAt = {};
      if (fromDate) match.createdAt.$gte = new Date(fromDate);
      if (toDate) match.createdAt.$lte = new Date(toDate);
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          userId: 1,
          userName: '$user.name',
          userEmail: '$user.email',
          name: 1,
          email: 1,
          mobile: 1,
          amount: 1,
          afterAmount: 1,
          charges: 1,
          reference: 1,
          utr: 1,
          status: 1,
          remark: 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ];

    if (exportCsv !== 'true') {
      pipeline.push(
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      );
    }

    const payIns = await PayIn.aggregate(pipeline);

    if (exportCsv === 'true') {
      const fields = [
        '_id',
        'userId',
        'userName',
        'userEmail',
        'name',
        'email',
        'mobile',
        'amount',
        'afterAmount',
        'charges',
        'reference',
        'utr',
        'status',
        'remark',
        'createdAt'
      ];
      const csv = parse(payIns, { fields });
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=payins.csv');
      return res.send(csv);
    }

    const totalPipeline = [{ $match: match }, { $count: 'total' }];
    const totalResult = await PayIn.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.json({
      success: true,
      data: payIns,
      pagination: {
        currentPage: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) { next(error) }
};

exports.createPayIn = async (req, res, next) => {
  try {
    const {
      userId,
      amount,
      reference,
      name,
      mobile,
      email,
      utr,
      remark,
      charges
    } = req.body;

    if (!userId || amount == null || !reference || !name || !mobile || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const payIn = await PayIn.create({
      userId,
      amount,
      reference,
      name,
      mobile,
      email,
      utr,
      remark,
      charges,
      status: 'Pending',
      adminAction: 'Pending'
    });

    res.status(201).json({ success: true, data: payIn });
  } catch (error) {
    next(error);
  }
};

exports.generatePayment = async (req, res, next) => {
  const { userId, amount, reference, name, mobile, email } = req.body;

  if (!amount || !reference || !name || !mobile || !email) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const user = await User.findOne({ _id: req?.user?.id || userId, status: true })
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found or not active" });
  }

  try {
    // const response = await axios.post(
    //   "https://api.worldpayme.com/api/v1.1/createUpiIntent ",
    //   {
    //     amount,
    //     reference,
    //     name,
    //     email,
    //     mobile,
    //   },
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI4IiwianRpIjoiOTcwY2YwZTE1NjcxMGIwZDQ3ZWZlOWY0ZWNjYmJkZDMxNjhmNWMxODc3MzE4ZTgwNzdmNmVmNTczOTZlZDIyNjkwNTZiOWNiZTFmNTBlMjEiLCJpYXQiOjE3NDA5NzgxMzkuOTk5MjM0LCJuYmYiOjE3NDA5NzgxMzkuOTk5MjM1LCJleHAiOjE3NzI1MTQxMzkuOTk2NjgxLCJzdWIiOiIyMzciLCJzY29wZXMiOltdfQ.lakPf6sw_uhlkeLzX0iWt3YAkeC4lJd-lici6uc_of4EIEJjMakV9xr77rv35jpNbw2QYDWpVbtNYMZeAWIaX5T9TnbPtI0_J0yyUr6WoKmNtV6xjCU5rJz-QGuLgvg-uurNxsWXW2mo3j3t202fvZPsCdY0PzLlWzDiLQJ8DjKIK10oLagBR7WANafjNujtX84A9wy9xYX1LDNwQtI6d6EjMg4TKwt3MazawXh57TjFC7X4bYMlSNshvCXICMSEQ8z_20GZqBAXtjguPjAmzpgVMD7hcMn4iGLP4Oqfo0hD36xvcszWk62IxsBlNHzwf9SJ6tEqWjJKZ7m36uOT79UEXJXQiPkguqbKZ2G3nQu8HN4rm0ccOFqnqKloNaDQJtbVn9N0PPN_ho_RqrNhA02Ut-BdTWbH8-y2DCQNHJeuf8Iee0f934dlnZPaNC76RHhgyKmsc2eaSmpEr9SGe6P-4BJ-pIJkkyl7xHCT4pu2t9Elt7lpjQW_BwztEZ8SJQNQVkv5hvXrtC-KAdnJ7ZAzMPxmCjSaFRgMGLnHr_iQiS8rTgfQFGBXSK4NXXVClaf0-EFoYIVIWUkhgoDMDJKmcjCDLPxOyjOfGy8Ha3oHvMzalEcLGX13f8a4EzzGPcZ3ZSfo3iqbBTNeFkgMr-39I5d9L5iAGYNz4wFiKA8`,
    //     },
    //   }
    // );

    // if (response.status !== 200) {
    //   throw new Error("Failed to create payment intent");
    // }

    const newPayIn = new PayIn({
      userId: user._id,
      amount,
      reference,
      name,
      mobile,
      email,
    });

    await newPayIn.save();

    return res.status(200).json({
      success: true,
      // data: response.data,
      message: "Payment intent created and data saved successfully.",
    });
  } catch (error) {
    next(error);
  }
};

exports.callbackPayIn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const data = req.body;

    const payin = await PayIn.findOne({ reference: data.reference }).session(session);
    if (!payin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (payin.status === "Success" || payin.status === "Failed") {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({ message: "Transaction already processed" });
    }

    const user = await User.findOne({ _id: payin.userId, status: true }).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found or inactive" });
    }

    if (data.status === "Success") {
      payin.status = "Success";
      payin.utr = data.utr;
      payin.remark = "Payment successful";
      await payin.save({ session });

      user.mainWallet += payin.amount;
      await user.save({ session });

    } else {
      payin.status = "Failed";
      payin.remark = data.error || "Payment failed";
      await payin.save({ session });
    }

    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      message: "Callback processed successfully",
    });
  } catch (error) {
    console.error("Error in callback handler:", error.message);
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.checkPayInStatus = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, message: "Reference ID is required" });
    }

    const payin = await PayIn.findOne(
      { reference },
      {
        _id: 0,
        reference: 1,
        status: 1,
        utr: 1,
        amount: 1,
        remark: 1,
        createdAt: 1,
      }
    );

    if (!payin) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...payin.toObject(),
        timestamp: payin.createdAt,
      },
    });

  } catch (error) {
    console.error("Error checking PayIn status:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
