const express = require("express");

const { getSourceCities, getAvailableTrips, getBoardingPointDetail, getTripDetails, blockTicket, bookTicket, checkBookedTicket, getTicketDetails, getCancellationData, cancelTicket } = require("../../controllers/BusBooking/BusBooking");

const router = express.Router();

router.get("/getSourceCities", getSourceCities);
router.post("/getAvailableTrips", getAvailableTrips);
router.post("/getTripDetails", getTripDetails);
router.post("/getBoardingPointDetail", getBoardingPointDetail);
router.post("/blockTicket", blockTicket);
router.post("/bookTicket", bookTicket);
router.post("/checkBookedTicket", checkBookedTicket);
router.post("/getTicketDetails", getTicketDetails);
router.post("/getCancellationData", getCancellationData);
router.post("/cancelTicket", cancelTicket);

module.exports = router;