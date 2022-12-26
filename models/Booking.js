const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    project_name: {
      type: String,
      required: false,
    },
    buying_date: {
      type: Date,
      required: true,
    },
    plotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plot",
      required: true,
    },
    per_marla_rate: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    advance_amount: {
      type: Number,
      required: true,
    },
    no_of_installments: {
      type: Number,
      required: true,
    },
    installment_duration: {
      type: Number,
      required: true,
    },
    document_expense: {
      type: Number,
      required: true,
    },
    ledger_page_number: {
      type: Number,
      required: true,
    },
    customer: {
      customer_name: {
        type: String,
        required: true,
      },
      father_name: {
        type: String,
        required: true,
      },
      cnic: {
        type: String,
        required: true,
      },
      mobile: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
