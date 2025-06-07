const axios = require("axios");
const generatePaysprintJWT = require("../../services/Dmt&Aeps/TokenGenrate");
const { startSession } = require('mongoose');
const userModel = require("../../models/userModel");
const Transaction = require("../../models/transactionModel");
const bbpsModel = require("../../models/bbpsModel");

const headers = {
  Token: generatePaysprintJWT(),
  Authorisedkey: "MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=",
};

const generateReferenceId = () => {
  const timestamp = Date.now().toString(36); // Short base36 timestamp
  const randomStr = Math.random().toString(36).substring(2, 8); // Random string
  return `REF${timestamp}${randomStr}`.toUpperCase();
};

const handleApiError = (error) => ({
  status: "error",
  message: error.response?.data?.message || "API request failed",
  error: error.message,
  details: error.response?.data || null,
});

const handleResponse = (res, data, successMessage) => {
  if (data.response_code === 1) {
    return res.status(200).json({
      status: "success",
      message: successMessage,
      data: data.data
    });
  }
  return res.status(400).json({
    ...data,
    status: "fail",
    message: data.message || "Operation failed",
  });
};

const getSourceCities = async (req, res, next) => {

  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/source",
      {},
      { headers }
    );
    handleResponse(res, response.data, "Source cities fetched successfully");
  } catch (error) {
    next(error);
  }
};

const getAvailableTrips = async (req, res) => {
  const { source_id, destination_id, date_of_journey } = req.body;
  if (!source_id || !destination_id || !date_of_journey) {
    res.status(400).json({ status: "failed", message: "all field are required" })
  }
  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/availabletrips",
      { source_id, destination_id, date_of_journey },
      { headers }
    );
    handleResponse(res, response.data, "Available trips fetched successfully");
  } catch (error) {
    res.status(500).json(handleApiError(error));
  }
};

const getTripDetails = async (req, res) => {
  const { trip_id } = req.body;
  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/tripdetails",
      { trip_id },
      { headers }
    );
    handleResponse(res, response.data, "Trip details fetched successfully");
  } catch (error) {
    res.status(500).json(handleApiError(error));
  }
};

const getBoardingPointDetail = async (req, res) => {
  const { bpId, trip_id } = req.body;
  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/boardingPoint",
      { bpId, trip_id },
      { headers }
    );
    handleResponse(res, response.data, "Boarding point details fetched successfully");
  } catch (error) {
    res.status(500).json(handleApiError(error));
  }
};

const blockTicket = async (req, res) => {
  const requiredFields = [
    'availableTripId', 'boardingPointId', 'droppingPointId',
    'source', 'destination', 'inventoryItems',
    'bookingType', 'paymentMode', 'serviceCharge'
  ];
  
  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/blockticket",
      req.body,
      { headers }
    );
    handleResponse(res, response.data, "Ticket blocked successfully");
  } catch (error) {
    res.status(500).json(handleApiError(error));
  }
};

const bookTicket = async (req, res) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { amount, passenger_phone, passenger_email, ...bookingData } = req.body;
    const referenceid = generateReferenceId();

    const user = await userModel.findById(userId).session(session).exec();

    if (!user || user.eWallet < amount) {
      throw new Error("Insufficient wallet balance");
    }

    user.eWallet -= amount;
    await user.save({ session });

    const debitTxn = await Transaction.create([{
      user_id: userId,
      transaction_type: "debit",
      amount,
      balance_after: user.eWallet,
      payment_mode: "wallet",
      transaction_reference_id: referenceid,
      description: `Bus ticket booking initiated with referenceId ${referenceid}`,
      status: "Pending"
    }], { session });

    const paysprintRes = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/bookticket",
      { amount, passenger_phone, passenger_email, ...bookingData, refid: referenceid },
      { headers }
    );

    const { response_code, message } = paysprintRes.data;
    let status = "Failed";

    if (response_code === 1) status = "Success";
    else if ([0, 2].includes(response_code)) status = "Pending";

    const bookingRecord = new bbpsModel({
      userId,
      rechargeType: "Bus Booking",
      operator: "Bus",
      customerNumber: passenger_phone,
      amount,
      transactionId: referenceid,
      extraDetails: {
        mobileNumber: passenger_phone,
        passenger_email
      },
      status
    });
    await bookingRecord.save({ session });

    debitTxn[0].status = status;
    await debitTxn[0].save({ session });

    if (status === "Failed") {
      user.eWallet += amount;
      await user.save({ session });

      await Transaction.create([{
        user_id: userId,
        transaction_type: "credit",
        amount,
        balance_after: user.eWallet,
        payment_mode: "wallet",
        transaction_reference_id: referenceid + "-refund",
        description: "Refund for failed ticket booking",
        status: "Success"
      }], { session });

      bookingRecord.status = "Refunded";
      await bookingRecord.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(status === "Success" ? 200 : 400).json({
      status: status.toLowerCase(),
      message: message || `Ticket booking ${status.toLowerCase()}`,
      refid: referenceid,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      status: "error",
      message: error.message,
      details: error.response?.data || null,
    });
  }
};

const checkBookedTicket = async (req, res) => {
  const { refid } = req.body;
  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/check_booked_ticket",
      { refid },
      { headers }
    );
    handleResponse(res, response.data, "Ticket details retrieved successfully");
  } catch (error) {
    res.status(500).json(handleApiError(error));
  }
};

const getTicketDetails = async (req, res) => {
  const { refid } = req.body;
  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/get_ticket",
      { refid },
      { headers }
    );
    handleResponse(res, response.data, "Ticket retrieved successfully");
  } catch (error) {
    res.status(500).json(handleApiError(error));
  }
};

const getCancellationData = async (req, res) => {
  const { refid } = req.body;

  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/get_cancellation_data",
      { refid },
      { headers }
    );
    handleResponse(res, response.data, "Cancellation data fetched successfully");
  } catch (error) {
    res.status(500).json(handleApiError(error));
  }
};

const cancelTicket = async (req, res) => {
  const { refid, seatsToCancel } = req.body;

  const session = await startSession();
  session.startTransaction();

  try {
    // First check if the ticket exists in our system
    const booking = await Booking.findOne({ refid }).session(session);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Process cancellation with Paysprint
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/cancel_ticket",
      { refid, seatsToCancel },
      { headers }
    );

    if (response.data.response_code !== 1) {
      throw new Error(response.data.message || "Cancellation failed");
    }

    if (!refundResult.success) {
      throw new Error(refundResult.message || "Refund processing failed");
    }
    booking.status = 'cancelled';
    booking.cancellationDate = new Date();
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    handleResponse(res, response.data, "Ticket cancelled successfully");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      status: "error",
      message: error.message,
      details: error.response?.data || null,
    });
  }
};

module.exports = {
  getSourceCities,
  getAvailableTrips,
  getTripDetails,
  getBoardingPointDetail,
  blockTicket,
  bookTicket,
  checkBookedTicket,
  getTicketDetails,
  getCancellationData,
  cancelTicket
};