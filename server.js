require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3500;
const path = require("path");
const { logger } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConn");
const mongoose = require("mongoose");
const { logEvents } = require("./middleware/logger");

// connect database
connectDB();

// add custom logger middleware
app.use(logger);

// add cors middleware
// app.use(cors(corsOptions));
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

app.use(express.json());

// add third party middleware
app.use(cookieParser());

app.use("/", express.static(path.join(__dirname, "public")));
app.use("/", require("./routes/root"));

app.use("/users", require("./routes/userRoutes"));
app.use("/notes", require("./routes/noteRoutes.js"));
app.use("/blocks", require("./routes/blockRoutes.js"));
app.use("/plots", require("./routes/plotRoutes.js"));
app.use("/bookings", require("./routes/bookingRoutes.js"));
app.use("/installments", require("./routes/installmentRoutes.js"));

app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found!" });
  } else {
    res.type("txt").send("404 Not Found!");
  }
});

// add custom error handler middleware
app.use(errorHandler);

mongoose.connection.once("open", () => {
  console.log("Conneted to mongodb");
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrorLog.log"
  );
});
