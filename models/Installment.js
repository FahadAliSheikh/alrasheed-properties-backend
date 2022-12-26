const mongoose = require("mongoose");

const installmentSchema = new mongoose.Schema({
  plotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plot",
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  amount: {
    type: Number,
    required: false,
  },
  account: {
    type: String,
    required: false,
  },
  instalment_month: {
    type: Date,
    required: true,
  },
  instalment_date: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Installment", installmentSchema);
