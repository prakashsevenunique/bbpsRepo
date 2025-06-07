const BbpsHistory = require('../models/bbpsModel.js');

exports.getBbpsReport = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      rechargeType,
      status,
      startDate,
      endDate,
      userId,
      operator,
      customerNumber,
    } = req.query;

    const matchStage = {};

    if (rechargeType) matchStage.rechargeType = rechargeType;
    if (status) matchStage.status = status;
    if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);
    if (operator) matchStage.operator = new RegExp(operator, 'i');
    if (customerNumber) matchStage.customerNumber = new RegExp(customerNumber, 'i');

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $sort: { createdAt: -1 }
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: parseInt(limit)
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          rechargeType: 1,
          operator: 1,
          customerNumber: 1,
          amount: 1,
          status: 1,
          charges: 1,
          transactionId: 1,
          extraDetails: 1,
          'user.name': 1,
          'user.email': 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    );

    const results = await BbpsHistory.aggregate(pipeline);

    const countPipeline = [
      ...(pipeline.filter(stage => Object.keys(stage)[0] !== '$sort' && Object.keys(stage)[0] !== '$skip' && Object.keys(stage)[0] !== '$limit')),
      { $count: 'total' }
    ];

    const countResult = await BbpsHistory.aggregate(countPipeline);
    const total = countResult.length ? countResult[0].total : 0;

    res.json({
      success: true,
      data: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
      }
    });

  } catch (err) {
    console.error('🔥 Error fetching BBPS report:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.saveRecharge = async (req, res) => {
  const {
    userId,
    rechargeType,
    operator,
    customerNumber,
    amount,
    transactionId,
    status,
    responseCode,
    responseMessage,
    extraDetails,
  } = req.body;

  try {
    const history = new BbpsHistory({
      userId,
      rechargeType,
      operator,
      customerNumber,
      amount,
      transactionId,
      status,
      responseCode,
      responseMessage,
      extraDetails,
    });

    await history.save();
    res.json({ success: true, message: 'Recharge history saved', data: history });
  } catch (err) {
    console.error('Error saving BBPS history:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};