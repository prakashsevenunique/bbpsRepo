const mongoose = require("mongoose");
require("dotenv").config();
const Merchant = require("./models/merchantModel"); // Import Merchant model
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const queryRoute = require("./routes/queryRoute");
const planRoute = require("./routes/planRoute");
const rechargeRoute = require("./routes/rechargeRoute");
// const loggerMiddleware = require("./middleware/loggerMiddleware");
const creditBillRoute = require("./routes/creditbillRoutes");
const OpLogoRoutes = require("./routes/OpLogoRoutes");
const billerRoutes = require("./routes/bbps/billerRoutes");
const KycRoutes = require("./routes/kycRoutes");
const servicePlanRoutes = require("./routes/servicePlanRoutes");
const userRequestRoutes = require("./routes/userRequestRoutes");
const commissionRoutes = require("./routes/commissionRoutes");
const payugateway = require("./routes/payu");

//admin routes
const adminRoutes = require("./routes/admin/adminUserRoutes");
const DmtRoutes = require("./routes/Dmt&Aeps/DmtRoutes");
const BusBooking = require("./routes/Busbooking/BusBooking");

// ✅ Import Cron Job
const app = express();

const cronJobs = require("./utils/cronJob");


app.use(cors());

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register Routes
// app.use(loggerMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/query", queryRoute);
app.use("/api/plan", planRoute);
app.use("/api/recharge", rechargeRoute);
app.use("/api/creditbill", creditBillRoute);
app.use("/api/oplogo", OpLogoRoutes);
app.use("/api/biller", billerRoutes);
app.use("/api/kyc", KycRoutes);
app.use("/api/service/plans", servicePlanRoutes);
app.use("/api/user/request", userRequestRoutes);
app.use("/api/payu", payugateway);
app.use("/api/Dmt", DmtRoutes);
app.use("/api/Busbooking", BusBooking);


app.use("/api/admin", adminRoutes);
app.use("/api/admin/commission", commissionRoutes);

app.get("/", (req, res) => res.json("welcome"));

const url = "mongodb://localhost:27017/";
mongoose
  .connect(process.env.MONGO_URI || url)
  .then(async () => {
    console.log("Connected to MongoDB");
    const merchant = await Merchant.findOne();
    if (!merchant) {
      await Merchant.create({ name: "Default Merchant", accountBalance: 0 });
      console.log("Default merchant account created.");
    }
    cronJobs;
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
  });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
