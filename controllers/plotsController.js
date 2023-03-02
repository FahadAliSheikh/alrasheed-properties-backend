const Plot = require("../models/Plot");
const Block = require("../models/Block");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const enums = require("../enums");
const { plot } = require("../enums");

//@desc Get all Plots
//@route GET /plots
//@access private
// const getAllPlots = asyncHandler(async (req, res) => {
//   const keyword = req.query.blockId
//     ? {
//         blockId: req.query.blockId,
//       }
//     : {};
//   console.log("keyword", keyword);
//   const plot = await Plot.find(keyword)
//     .populate("blockId")
//     .populate("customerId");
//   if (!plot?.length) {
//     return res.status(404).json({ message: "No plot found" });
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
//   res.status(200).json({ message: "List of found plots", data: plot });
//   // res.status(201).json({ messaage: `New Block ${block.name} created` });
// });

const getAllPlots = asyncHandler(async (req, res) => {
  let filters = {};

  // Filter plots for a specific blockId
  if (req.query.blockId) {
    // const blockId = req.query.blockId;
    filters["blockId"] = new mongoose.Types.ObjectId(req.query.blockId);
  }
  //Filter plots on basis of ledger page number
  if (req.query.ledger_page_number) {
    // const blockId = req.query.blockId;
    filters["ledger_page_number"] = Number(req.query.ledger_page_number);
  }

  // //Filter plots on basis of ledger page number
  // if (req.query. ) {
  //   filters[""] = req.query.ledger_page_number;
  // }

  //Filter plots on basis of category
  if (req.query.category) {
    filters["category"] = req.query.category;
  }

  //Filter plots on basis of plot type
  if (req.query.plot_type) {
    filters["plot_type"] = req.query.plot_type;
  }

  //Filter plots on basis of sold status
  let plot_sold_statu = req.query.sold_status;
  if (plot_sold_statu === "true" || plot_sold_statu === "false") {
    filters["sold_status"] = JSON.parse(plot_sold_statu);
  }

  //Filter plots on basis of plot number
  if (req.query.plot_number) {
    filters["plot_number"] = Number(req.query.plot_number);
  }

  // console.log("filters", filters);
  let pipeline = [
    {
      $match: filters,
    },
    {
      $project: {
        _id: 1,
        plot_number: 1,
        plot_type: 1,
        area: 1,
        area_unit: 1,
        category: 1,
        is_cornered: 1,
        sold_status: 1,
        customerId: 1,
        ledger_page_number: 1,
        blockId: 1,
        // plot: "$$ROOT",
      },
    },
    {
      $lookup: {
        from: "blocks",
        localField: "blockId",
        foreignField: "_id",
        as: "blockId",
      },
    },
    {
      $unwind: {
        path: "$blockId",
      },
    },
  ];

  const plots = await Plot.aggregate(pipeline).exec();
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
  res.status(200).json({ message: "List of found plots", data: plots });
  // res.status(201).json({ messaage: `New Block ${block.name} created` });
});

//@desc Get single Plot
//@route GET /plot/:id
//@access private
const getPlotById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({ message: "Please provide plot id" });
  }
  const plot = await Plot.findById(id)
    .populate("blockId")
    .populate("customerId");
  if (!plot) {
    return res.status(404).json({ message: "No plot found" });
  }

  // res.json(notesWithUser);
  res.status(200).json({ message: "Found plot", data: plot });
  // res.status(201).json({ messaage: `New Block ${block.name} created` });
});

//@desc  Create new Plot
//@route POST /plots
//@access private
const createNewPlot = asyncHandler(async (req, res) => {
  const {
    blockId,
    plot_number,
    plot_type,
    area_unit,
    area,
    category,
    is_cornered,
  } = req.body;
  // Validate
  if (
    !blockId ||
    !plot_number ||
    !plot_type ||
    !area ||
    !area_unit ||
    !category
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let allowedUnits = [enums.area_unit.kanal, enums.area_unit.marla];
  let allowedCategory = [enums.category.commercial, enums.category.residential];
  let allowedPlotType = [enums.type.shop, enums.type.house];

  if (allowedUnits.indexOf(area_unit) < 0) {
    res.status(400).json({ message: "Invalid unit for area!" });
  }
  if (allowedCategory.indexOf(category) < 0) {
    res.status(400).json({ message: "Invalid plot category!" });
  }
  if (allowedPlotType.indexOf(plot_type) < 0) {
    res.status(400).json({ message: "Invalid plot type!" });
  }

  // Check for block
  const foundBlock = await Block.findOne({ _id: blockId }).lean().exec();
  if (!foundBlock) {
    return res.status(409).json({ message: "Block not found!" });
  }

  // Check for duplicate title
  const duplicate = await Plot.findOne({
    $and: [{ plot_number: plot_number }, { blockId: blockId }],
  })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate plot number" });
  }

  //Create note object
  const plotObject = {
    blockId,
    plot_number,
    plot_type,
    area,
    area_unit,
    category,
    is_cornered,
  };

  //Create a new Note
  const plot = await Plot.create(plotObject);
  if (plot) {
    res.status(201).json({
      messaage: `New Plot with ${plot.plot_number} created`,
      data: plot,
    });
  } else {
    res.status(400).json({ message: "Invalid plot data received!" });
  }
});

//@desc  Update Plot
//@route Patch /plots
//@access private
const updatePlot = asyncHandler(async (req, res) => {
  const {
    _id,
    blockId,
    plot_number,
    plot_type,
    area_unit,
    area,
    category,
    is_cornered,
  } = req.body;
  //Validate fields
  if (
    (!_id,
    !blockId || !plot_number || !plot_type || !area || !area_unit || !category)
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  //Find Plot
  const plot = await Plot.findById(_id).exec();

  if (!plot) {
    return res.status(400).json({ messaage: "No plot found!" });
  }

  let allowedUnits = [enums.area_unit.kanal, enums.area_unit.marla];
  let allowedCategory = [enums.category.commercial, enums.category.residential];
  let allowedPlotType = [enums.type.shop, enums.type.house];

  if (allowedUnits.indexOf(area_unit) < 0) {
    res.status(400).json({ message: "Invalid unit for area!" });
  }
  if (allowedCategory.indexOf(category) < 0) {
    res.status(400).json({ message: "Invalid plot category!" });
  }
  if (allowedPlotType.indexOf(plot_type) < 0) {
    res.status(400).json({ message: "Invalid plot type!" });
  }
  // Check for block
  const foundBlock = await Block.findOne({ _id: blockId }).lean().exec();
  if (!foundBlock) {
    return res.status(409).json({ message: "Block not found!" });
  }

  // Check for duplicate title
  const duplicate = await Plot.findOne({
    $and: [{ plot_number: { $eq: plot_number } }, { _id: { $ne: _id } }],
  })
    .lean()
    .exec();

  // console.log("duplicate", duplicate);
  if (duplicate) {
    return res.status(409).json({ message: "Duplicate plot number" });
  }
  // Allow renaming of the original name
  if (duplicate && duplicate?._id.toString() !== _id) {
    return res.status(409).json({ message: "Duplicate block name" });
  }

  plot.plot_number = plot_number;
  plot.plot_type = plot_type;
  plot.area_unit = area_unit;
  plot.area = area;
  plot.category = category;
  plot.is_cornered = is_cornered;

  const updatedPlot = await plot.save();
  res.json({
    message: `${updatedPlot.plot_number} updated!`,
    data: updatedPlot,
  });
});

//@desc Delete a Plot
//@route DELETE /plots
//@access private
const deletePlot = asyncHandler(async (req, res) => {
  const { _id } = req.body;
  //Validate fields
  if (!_id) {
    return res.status(400).json({ message: "Plot ID Required" });
  }
  //Find Note
  const plot = await Plot.findById(_id).exec();
  if (!plot) {
    return res.status(400).json({ message: "Plot not found!" });
  }
  //Delete Note
  const result = await plot.deleteOne();
  const reply = `Block ${result.plot_number} deleted`;
  res.json({ message: reply });
});

//@desc Get all blocks
//@route GET /blocks
//@access private
const getPlotsSummary = asyncHandler(async (req, res) => {
  // const { blockId, startDate, endDate } = req.query;
  // const block = await Block.find().lean();
  // if (!block?.length) {
  //   return res.status(404).json({ message: "No notes found" });
  // }

  let filters = {};
  // Filter plots for a specific blockId
  // if (!startDate || !endDate) {
  //   res.send("Start and end dates are required!");
  // }
  if (req.query.blockId) {
    filters["blockId"] = new mongoose.Types.ObjectId(req.query.blockId);
  }

  // if (startDate != null && endDate != null) {
  //   filters["createdAt"] = {
  //     $gte: new Date(startDate),
  //     $lte: new Date(endDate),
  //   };
  // }

  let pipeline = [
    {
      $match: filters,
    },
    {
      $project: {
        _id: 1,
        blockId: 1,
        sold_status: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ];

  const plots = await Plot.aggregate(pipeline).exec();
  if (!plots?.length) {
    return res.status(404).json({ message: "No plots found" });
  }

  // console.log(plots);
  let total_plots = plots.length;
  let sold_plots = await plots.reduce(
    (counter, { sold_status }) =>
      sold_status === true ? (counter += 1) : counter,
    0
  );
  let unsold_plots = await plots.reduce(
    (counter, { sold_status }) =>
      sold_status === false ? (counter += 1) : counter,
    0
  );

  let summary = {
    total_plots,
    sold_plots,
    unsold_plots,
  };

  res.status(200).json({ message: "Plots summary!", data: summary });
  // res.status(201).json({ messaage: `New Block ${block.name} created` });
});

module.exports = {
  getAllPlots,
  getPlotById,
  createNewPlot,
  updatePlot,
  deletePlot,
  getPlotsSummary,
};
