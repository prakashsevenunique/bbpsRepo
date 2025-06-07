const mongoose = require("mongoose");
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { errors } = require('celebrate');
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const KycRoutes = require("./routes/kycRoutes");
const serviceRoutes = require("./routes/serviceRoutes");

const rechargeRoute = require("./routes/rechargeRoute");
const billerRoutes = require("./routes/bbps/billerRoutes");
const DmtRoutes = require("./routes/Dmt&Aeps/DmtRoutes");
const BusBooking = require("./routes/Busbooking/BusBooking");
const apiLogger = require("./middleware/apiLogger.js");


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(apiLogger); 


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", require("./routes/userMetaRoutes.js"));
app.use("/api/v1/kyc", KycRoutes);
app.use("/api/v1/service", serviceRoutes);
app.use("/api/v1/e-wallet", require("./routes/WalletRoutes.js"));
app.use("/api/v1/payment", require("./routes/mainWalletRoutes.js"));
app.use("/api/v1/query", require("./routes/queryRoutes.js"));
app.use("/api/v1/payment_req", require("./routes/paymentRoutes.js"));
app.use("/api/v1/billAvenue", require("./routes/billAvenueRoutes.js"));
app.use("/api/v1/bbps", require("./routes/bbpsRoutes.js"));
app.use("/api/v1/s3", require("./routes/sprintRoutes.js"));
app.use("/api/v1/kyc", require("./routes/kycvideo.js"));



app.use("/api/recharge", rechargeRoute);
app.use("/api/biller", billerRoutes);
app.use("/api/Dmt", DmtRoutes);
app.use("/api/Busbooking", BusBooking);


app.get("/", (req, res) => res.json("welcome ranjay sir"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

const PORT = process.env.PORT || 8080;

app.use(errors());
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
