const Block = require("../models/Block");
const Plot = require("../models/Plot");
const Booking = require("../models/Booking");
const enums = require("../enums");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Installment = require("../models/Installment");

//@desc Get all installments
//@route GET /installments
//@access private
// const getAllInstallments = asyncHandler(async (req, res) => {
//   const installment = await Installment.find().exec();
//   if (!installment?.length) {
//     return res.status(404).json({ message: "No installment found" });
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
//   res
//     .status(200)
//     .json({ message: "List of found installments", data: installment });
//   // res.status(201).json({ messaage: `New Block ${block.name} created` });
// });

const getAllInstallments = asyncHandler(async (req, res) => {
  let filters = {};
  if (req.query.plotId) {
    // const plotId = req.query.plotId;
    filters["plotId"] = new mongoose.Types.ObjectId(req.query.plotId);
  }
  if (req.query.bookingId) {
    // const plotId = req.query.plotId;
    filters["bookingId"] = new mongoose.Types.ObjectId(req.query.bookingId);
  }

  let pipeline = [
    {
      $match: filters,
    },
    {
      $project: {
        _id: 1,
        plotId: 1,
        bookingId: 1,
        amount: 1,
        account: 1,
        instalment_month: 1,
        instalment_date: 1,
        // plot: "$$ROOT",
      },
    },
  ];

  const installments = await Installment.aggregate(pipeline).exec();

  res
    .status(200)
    .json({ message: "List of found installments", data: installments });
});

//@desc Get single installments
//@route GET /installments/:id
//@access private
const getInstallmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({ message: "Please provide installment id" });
  }
  const installment = await Installment.findById(id).populate(
    "plotId",
    "bookingId"
  );
  if (!installment) {
    return res.status(404).json({ message: "No installment found" });
  }

  // res.json(notesWithUser);
  res.status(200).json({ message: "Found installment", data: installment });
  // res.status(201).json({ messaage: `New Block ${block.name} created` });
});

//@desc  Create new installments
//@route POST /installments
//@access private
const createNewInstallment = asyncHandler(async (req, res) => {
  const { plotId, account, instalment_month, instalment_date, amount } =
    req.body;
  // Validate
  if (!plotId || !account || !instalment_month || !instalment_date || !amount) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check for duplicate booking for a plot
  const foundPlot = await Plot.findOne({ _id: plotId }).exec();

  if (!foundPlot) {
    return res.status(409).json({ message: "Plot not found!" });
  }

  // Check for  booking for a plot
  const foundBooking = await Booking.findOne({
    plotId: plotId,
  }).exec();

  if (!foundBooking) {
    return res.status(409).json({ message: "Plot booking not found!" });
  }

  //Create installments object
  const instObject = {
    plotId,
    bookingId: String(foundBooking._id),
    account,
    amount,
    instalment_month,
    instalment_date,
  };
  //Create a new installments
  const createdInst = await Installment.create(instObject);
  console.log(createdInst);
  if (createdInst) {
    res
      .status(201)
      .json({ messaage: `New Installment created`, data: createdInst });
  } else {
    res.status(400).json({ message: "Invalid booking data received!" });
  }
});

//@desc  Update installments
//@route Patch /installments
//@access private
const updateInstallment = asyncHandler(async (req, res) => {
  const { _id, account, amount, instalment_month, instalment_date } = req.body;
  // Validate
  if (!_id || !account || !amount || !instalment_month || !instalment_date) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // find installment
  const foundInstal = await Installment.findById(_id).exec();

  if (!foundInstal) {
    return res.status(409).json({ message: "Installment not found!" });
  }

  //Create installments object
  foundInstal.account = account;
  foundInstal.amount = amount;
  foundInstal.instalment_month = instalment_month;
  foundInstal.instalment_date = instalment_date;

  //Create a new installments
  const updateInst = await Installment.save();
  console.log(updateInst);
  if (updateInst) {
    res
      .status(201)
      .json({ messaage: ` Installment updated`, data: updateInst });
  } else {
    res.status(400).json({ message: "Invalid installment data received!" });
  }
});

//@desc Delete a installments
//@route DELETE /installments
//@access private
const deleteInstallment = asyncHandler(async (req, res) => {
  const { _id } = req.body;
  //Validate fields
  if (!_id) {
    return res.status(400).json({ message: "Installment ID Required" });
  }
  //Find Installment
  const installment = await Installment.findById(_id).exec();
  if (!installment) {
    return res.status(400).json({ message: "Installment not found!" });
  }

  //Delete Booking
  const result = await installment.deleteOne();
  const reply = `Installment deleted`;
  res.json({ message: reply });
});

module.exports = {
  getAllInstallments,
  getInstallmentById,
  createNewInstallment,
  updateInstallment,
  deleteInstallment,
};
