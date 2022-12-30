const Block = require("../models/Block");
const Plot = require("../models/Plot");
const Booking = require("../models/Booking");
const mongoose = require("mongoose");
const enums = require("../enums");
const asyncHandler = require("express-async-handler");

//@desc Get all bookings
//@route GET /bookings
//@access private
// const getAllBookings = asyncHandler(async (req, res) => {
//   const booking = await Booking.find().populate("plotId");
//   if (!booking?.length) {
//     return res.status(404).json({ message: "No booking found" });
//   }

//   // Add username to each note before sending the response
//   // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE
//   // You could also do this with a for...of loop
//   // const notesWithUser = await Promise.all(
//   //   notes.map(async (note) => {
//   //     const user = await User.findById(note.user).lean().exec();
//   //     return { ...note, username: user.username };
//   //   })
//   // );

//   // res.json(notesWithUser);
//   res.status(200).json({ message: "List of found blocks", data: booking });
//   // res.status(201).json({ messaage: `New Block ${block.name} created` });
// });

const getAllBookings = asyncHandler(async (req, res) => {
  // const booking = await Booking.find().populate("plotId");
  let filters = {};
  let customerFilters = {};

  // Filter plots for a specific plotId
  if (req.query.plotId) {
    // const plotId = req.query.plotId;
    filters["plotId"] = new mongoose.Types.ObjectId(req.query.plotId);
  }
  //Filter plots on basis of ledger page number
  if (req.query.ledger_page_number) {
    // const blockId = req.query.blockId;
    filters["ledger_page_number"] = Number(req.query.ledger_page_number);
  }

  //Filter plots on basis of ledger page number
  if (req.query.customer_name) {
    // const blockId = req.query.blockId;
    // customerFilters["customer.customer_name"] = req.query.customer_name;

    customerFilters["customer.customer_name"] = {
      $regex: req.query.customer_name,
      $options: "i",
    };
  }
  //Filter plots on basis of ledger page number
  if (req.query.customer_cnic) {
    // const blockId = req.query.blockId;
    // customerFilters["customer.customer_name"] = req.query.customer_name;

    customerFilters["customer.cnic"] = {
      $regex: req.query.customer_cnic,
      $options: "i",
    };
  }

  console.log("filters", filters);
  console.log("customer filters", customerFilters);

  let pipeline = [
    {
      $match: filters,
    },
    {
      $project: {
        _id: 1,
        project_name: 1,
        buying_date: 1,
        plotId: 1,
        per_marla_rate: 1,
        total_amount: 1,
        advance_amount: 1,
        no_of_installments: 1,
        installment_duration: 1,
        document_expense: 1,
        ledger_page_number: 1,
        customer: 1,
        // plot: "$$ROOT",
      },
    },
    {
      $lookup: {
        from: "plots",
        localField: "plotId",
        foreignField: "_id",
        as: "plotId",
      },
    },
    {
      $unwind: {
        path: "$plotId",
      },
    },
    {
      $match: customerFilters,
    },
  ];

  const booking = await Booking.aggregate(pipeline).exec();

  // Add username to each note before sending the response
  // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE
  // You could also do this with a for...of loop
  // const notesWithUser = await Promise.all(
  //   notes.map(async (note) => {
  //     const user = await User.findById(note.user).lean().exec();
  //     return { ...note, username: user.username };
  //   })
  // );

  // res.json(notesWithUser);
  res.status(200).json({ message: "List of found blocks", data: booking });
  // res.status(201).json({ messaage: `New Block ${block.name} created` });
});

//@desc Get single Booking
//@route GET /boookings/:id
//@access private
const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({ message: "Please provide booking id" });
  }
  const booking = await Booking.findById(id).populate("plotId");
  if (!booking) {
    return res.status(404).json({ message: "No booking found" });
  }

  // res.json(notesWithUser);
  res.status(200).json({ message: "Found booking", data: booking });
  // res.status(201).json({ messaage: `New Block ${block.name} created` });
});

//@desc  Create new Booking
//@route POST /bookings
//@access private
const createNewBooking = asyncHandler(async (req, res) => {
  const {
    project_name,
    buying_date,
    plotId,
    per_marla_rate,
    total_amount,
    advance_amount,
    no_of_installments,
    installment_duration,
    document_expense,
    ledger_page_number,
    customer_name,
    father_name,
    cnic,
    mobile,
    address,
  } = req.body;
  // Validate
  if (
    !project_name ||
    !buying_date ||
    !plotId ||
    !per_marla_rate ||
    !total_amount ||
    !advance_amount ||
    !no_of_installments ||
    !installment_duration ||
    !document_expense ||
    !ledger_page_number ||
    !customer_name ||
    !father_name ||
    !cnic ||
    !mobile ||
    !address
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check for duplicate booking for a plot
  const foundPlot = await Plot.findOne({ _id: plotId }).exec();

  if (!foundPlot) {
    return res.status(409).json({ message: "Plot not found!" });
  }

  // check if plot is already sold
  if (foundPlot.status === enums.plot.sold_status.sold) {
    return res.status(409).json({ message: "Plot already sold" });
  }

  // Check for duplicate booking for a plot
  const duplicate = await Booking.findOne({ plotId: plotId }).lean().exec();
  if (duplicate) {
    return res.status(409).json({ message: "Duplicate booking for plot" });
  }

  //Create booking object
  const bookingObject = {
    project_name,
    buying_date,
    plotId,
    per_marla_rate,
    total_amount,
    advance_amount,
    no_of_installments,
    installment_duration,
    document_expense,
    ledger_page_number,
    customer: {
      customer_name,
      father_name,
      cnic,
      mobile,
      address,
    },
  };

  //Create a new Note
  const createdBooking = await Booking.create(bookingObject);
  console.log(createdBooking);
  if (createdBooking) {
    res
      .status(201)
      .json({ messaage: `New Booking created`, data: createdBooking });
    foundPlot.sold_status = enums.plot.sold_status.sold;
    // update Plot Status
    await foundPlot.save();
  } else {
    res.status(400).json({ message: "Invalid booking data received!" });
  }
});

//@desc  Update Booking
//@route Patch /bookings
//@access private
const updateBooking = asyncHandler(async (req, res) => {
  const {
    _id,
    project_name,
    buying_date,
    // plotId,
    per_marla_rate,
    total_amount,
    advance_amount,
    no_of_installments,
    installment_duration,
    document_expense,
    ledger_page_number,
    customer_name,
    father_name,
    cnic,
    mobile,
    address,
  } = req.body;
  // Validate
  if (
    !_id ||
    !project_name ||
    !buying_date ||
    // !plotId ||
    !per_marla_rate ||
    !total_amount ||
    !advance_amount ||
    !no_of_installments ||
    !installment_duration ||
    !document_expense ||
    !ledger_page_number ||
    !customer_name ||
    !father_name ||
    !cnic ||
    !mobile ||
    !address
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
  // find booking
  const foundBooking = await Booking.findById(_id).exec();

  if (!foundBooking) {
    return res.status(409).json({ message: "Booking not found!" });
  }

  // Check for duplicate booking for a plot
  // const foundPlot = await Plot.findOne({ _id: plotId }).exec();

  // if (!foundPlot) {
  //   return res.status(409).json({ message: "Plot not found!" });
  // }

  // // check if plot is already sold
  // if (foundPlot.status === enums.plot.sold_status.sold) {
  //   return res.status(409).json({ message: "Plot already sold" });
  // }

  // Check for duplicate booking for a plot
  // const duplicate = await Booking.findOne({ plot_id: plot_id }).lean().exec();

  // if (duplicate) {
  //   return res.status(409).json({ message: "Duplicate booking for plot" });
  // }

  //Create booking object
  // const bookingObject = {
  foundBooking.project_name = project_name;
  foundBooking.buying_date = buying_date;
  // foundBooking.plot_id = plot_id;
  foundBooking.per_marla_rate = per_marla_rate;
  foundBooking.total_amount = total_amount;
  foundBooking.advance_amount = advance_amount;
  foundBooking.no_of_installments = no_of_installments;
  foundBooking.installment_duration = installment_duration;
  foundBooking.document_expense = document_expense;
  foundBooking.ledger_page_number = ledger_page_number;
  foundBooking.customer.customer_name = customer_name;
  foundBooking.customer.father_name = customer_name;
  foundBooking.customer.cnic = cnic;
  foundBooking.customer.mobile = mobile;
  foundBooking.customer.address = address;

  // };

  //Create a new Note
  const updatedBooking = await foundBooking.save();
  if (updatedBooking) {
    res.status(201).json({ messaage: `Booking updated`, data: updatedBooking });
  } else {
    res.status(400).json({ message: "Error in updating booking!" });
  }
});

//@desc Delete a Booking
//@route DELETE /bookings
//@access private
const deleteBooking = asyncHandler(async (req, res) => {
  const { _id } = req.body;
  //Validate fields
  if (!_id) {
    return res.status(400).json({ message: "Booking ID Required" });
  }
  //Find Booking
  const booking = await Booking.findById(_id).exec();
  if (!booking) {
    return res.status(400).json({ message: "Booking not found!" });
  }
  const foundPlot = await Plot.findOne({ _id: booking.plotId }).exec();

  // if (!foundPlot) {
  //   return res.status(409).json({ message: "Plot not found!" });
  // }

  //Delete Booking
  const result = await booking.deleteOne();
  const reply = `Booking deleted`;
  res.json({ message: reply });
  foundPlot.sold_status = false;
  foundPlot.save();
});

module.exports = {
  getAllBookings,
  getBookingById,
  createNewBooking,
  updateBooking,
  deleteBooking,
};
