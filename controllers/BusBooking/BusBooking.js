const axios = require("axios");
const generatePaysprintJWT = require("../../services/Dmt&Aeps/TokenGenrate");

// POST: /get-source-cities
const getSourceCities = async (req, res) => {
  try {
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/source",
      {}, // API body empty hoti hai
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Source cities fetched successfully",
        data: resData.data,
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: resData.message || "Unable to fetch source cities",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message:
        error.response?.data?.message || "API request failed",
      error: error.message,
    });
  }
};
// POST: /get-available-trips
const getAvailableTrips = async (req, res) => {
  const { source_id, destination_id, date_of_journey } = req.body;

  // Validate required fields
  if (!source_id || !destination_id || !date_of_journey) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide source_id, destination_id, and date_of_journey",
    });
  }

  try {
    const payload = {
      source_id,
      destination_id,
      date_of_journey,
    };
    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/availabletrips",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Available trips fetched successfully",
        data: resData.data,
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: resData.message || "Unable to fetch available trips",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message:
        error.response?.data?.message || "API request failed",
      error: error.message,
    });
  }
};
// POST: /get-trip-details
const getTripDetails = async (req, res) => {
  const { trip_id } = req.body;

  if (!trip_id) {
    return res.status(400).json({
      status: "fail",
      message: "trip_id is required",
    });
  }

  try {
    const payload = { trip_id };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/tripdetails",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Trip details fetched successfully",
        data: resData.data,
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: resData.message || "Failed to fetch trip details",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "API request failed",
      error: error.message,
    });
  }
};
// POST: /get-boarding-point-detail
const getBoardingPointDetail = async (req, res) => {
  const { bpId, trip_id } = req.body;

  // Validate required fields
  if (!bpId || !trip_id) {
    return res.status(400).json({
      status: "fail",
      message: "Both bpId (boarding point ID) and trip_id are required.",
    });
  }

  try {
    const payload = {
      bpId,
      trip_id,
    };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/boardingPoint",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Boarding point details fetched successfully",
        data: resData.data,
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: resData.message || "Failed to fetch boarding point details",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message:
        error.response?.data?.message || "API request failed",
      error: error.message,
    });
  }
};
// POST: /block-ticket
const blockTicket = async (req, res) => {
  const {
    availableTripId,
    boardingPointId,
    droppingPointId,
    source,
    destination,
    inventoryItems,
    bookingType,
    paymentMode,
    serviceCharge,
  } = req.body;

  // ✅ Validate required fields
  if (
    !availableTripId ||
    !boardingPointId ||
    !droppingPointId ||
    !source ||
    !destination ||
    !inventoryItems ||
    !bookingType ||
    !paymentMode ||
    !serviceCharge
  ) {
    return res.status(400).json({
      status: "fail",
      message:
        "Missing required fields. Please provide all parameters as per API specification.",
    });
  }

  try {
    const payload = {
      availableTripId,
      boardingPointId,
      droppingPointId,
      source,
      destination,
      inventoryItems,
      bookingType,
      paymentMode,
      serviceCharge,
    };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/blockticket",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Ticket Blocked Successfully",
        data: resData.data,
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: resData.message || "Failed to block ticket",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "Block ticket API failed",
      error: error.message,
    });
  }
};
// POST: /book-ticket
const bookTicket = async (req, res) => {
  const {
    refid,
    amount,
    base_fare,
    blockKey,
    passenger_phone,
    passenger_email,
  } = req.body;

  // ✅ Validate required fields
  if (!refid || !amount || !base_fare || !blockKey || !passenger_phone || !passenger_email) {
    return res.status(400).json({
      status: "fail",
      message: "Missing required fields: refid, amount, base_fare, blockKey, passenger_phone, passenger_email",
    });
  }

  try {
    const payload = {
      refid,
      amount,
      base_fare,
      blockKey,
      passenger_phone,
      passenger_email,
    };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/bookticket",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Ticket booked successfully",
        data: resData.data,
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: resData.message || "Failed to book ticket",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "Book ticket API failed",
      error: error.message,
    });
  }
};
// POST: /check-booked-ticket
const checkBookedTicket = async (req, res) => {
  const { refid } = req.body;

  if (!refid) {
    return res.status(400).json({
      status: "fail",
      message: "refid (Reference ID) is required",
    });
  }

  try {
    const payload = { refid };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/check_booked_ticket",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Ticket details retrieved successfully",
        data: resData.data,
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: resData.message || "Failed to retrieve ticket details",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "API request failed",
      error: error.message,
    });
  }
};
// POST: /get-ticket-details
const getTicketDetails = async (req, res) => {
  const { refid } = req.body;

  if (!refid) {
    return res.status(400).json({
      status: "fail",
      message: "refid (Reference ID) is required",
    });
  }

  try {
    const payload = { refid };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/get_ticket",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Ticket retrieved successfully",
        data: resData.data,
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: resData.message || "Failed to retrieve ticket",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "API request failed",
      error: error.message,
    });
  }
};
// POST: /get-cancellation-data
const getCancellationData = async (req, res) => {
  const { refid } = req.body;

  if (!refid) {
    return res.status(400).json({
      status: "fail",
      message: "refid (Reference ID) is required",
    });
  }

  try {
    const payload = { refid };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/get_cancellation_data",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Cancellation data fetched successfully",
        data: resData.data,
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: resData.message || "Failed to fetch cancellation data",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message:
        error.response?.data?.message || "Cancellation data API failed",
      error: error.message,
    });
  }
};
// POST: /cancel-ticket
const cancelTicket = async (req, res) => {
  const { refid, seatsToCancel } = req.body;

  if (!refid || !seatsToCancel) {
    return res.status(400).json({
      status: "fail",
      message: "refid and seatsToCancel are required",
    });
  }

  try {
    const payload = {
      refid,
      seatsToCancel,
    };

    const response = await axios.post(
      "https://sit.paysprint.in/service-api/api/v1/service/bus/ticket/cancel_ticket",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          'Token': generatePaysprintJWT(),
          'Authorisedkey': 'MGY1MTVmNWM3Yjk5MTdlYTcyYjk5NmUzZjYwZDVjNWE=',
        },
      }
    );

    const resData = response.data;

    if (resData.response_code === 1) {
      return res.status(200).json({
        status: "success",
        message: "Ticket cancelled successfully",
        data: resData.data,
      });
    } else {
      return res.status(400).json({
        status: "fail",
        message: resData.message || "Failed to cancel ticket",
        data: resData,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.response?.data?.message || "Cancellation API failed",
      error: error.message,
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
