const mongoose = require("mongoose");

const plotSchema = new mongoose.Schema(
  {
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "Block",
    },

    plot_number: {
      type: Number,
      required: true,
    },
    plot_type: {
      type: String,
      required: true,
    },

    area: {
      type: Number,
      required: true,
    },
    area_unit: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    is_cornered: {
      type: Boolean,
      required: true,
      default: false,
    },
    sold_status: {
      type: Boolean,
      required: true,
      default: false,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "Customer",
    },
    ledger_page_number: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Plot", plotSchema);
