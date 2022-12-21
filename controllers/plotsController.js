const Plot = require("../models/Plot");
const Block = require("../models/Block");

const asyncHandler = require("express-async-handler");
const enums = require("../enums");

//@desc Get all Plots
//@route GET /plots
//@access private
const getAllPlots = asyncHandler(async (req, res) => {
  const plot = await Plot.find().lean();
  if (!plot?.length) {
    return res.status(404).json({ message: "No plot found" });
  }

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
  res.status(200).json({ message: "List of found plots", data: plot });
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
  const duplicate = await Plot.findOne({ plot_number }).lean().exec();

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
  console.log(plot);
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
  const { _id, name, area, area_unit, category } = req.body;

  //Validate fields
  if (!_id || !name || !area || !area_unit || !category) {
    return res.status(400).json({ message: "All fields are required" });
  }

  //Find Note
  const block = await Block.findById(_id).exec();

  if (!block) {
    return res.status(400).json({ messaage: "No block found!" });
  }

  let allowedUnits = [enums.area_unit.kanal, enums.area_unit.marla];
  let allowedCategory = [enums.category.commercial, enums.category.residential];

  if (allowedUnits.indexOf(area_unit) < 0) {
    res.status(400).json({ message: "Invalid unit for area!" });
  }
  if (allowedCategory.indexOf(category) < 0) {
    res.status(400).json({ message: "Invalid plot category!" });
  }

  // Check for duplicate name
  const duplicate = await Block.findOne({ name }).lean().exec();

  // Allow renaming of the original name
  if (duplicate && duplicate?._id.toString() !== _id) {
    return res.status(409).json({ message: "Duplicate block name" });
  }

  block.name = name;
  block.area = area;
  block.area_unit = area_unit;
  block.category = category;
  const updatedBlock = await block.save();
  res.json({ message: `${updatedBlock.name} updated!`, data: updatedBlock });
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

module.exports = {
  getAllPlots,
  createNewPlot,
  updatePlot,
  deletePlot,
};
