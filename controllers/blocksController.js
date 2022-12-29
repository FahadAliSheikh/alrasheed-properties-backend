const Block = require("../models/Block");
const asyncHandler = require("express-async-handler");
const enums = require("../enums");

//@desc Get all blocks
//@route GET /blocks
//@access private
// const getAllBlocks = asyncHandler(async (req, res) => {
//   const block = await Block.find().lean();
//   if (!block?.length) {
//     return res.status(404).json({ message: "No notes found" });
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
//   res.status(200).json({ message: "List of found blocks", data: block });
//   // res.status(201).json({ messaage: `New Block ${block.name} created` });
// });

const getAllBlocks = asyncHandler(async (req, res) => {
  // const block = await Block.find().lean();
  // if (!block?.length) {
  //   return res.status(404).json({ message: "No notes found" });
  // }

  let filters = {};
  if (req.query.category) {
    // const plotId = req.query.plotId;
    filters["category"] = req.query.category;
  }

  let pipeline = [
    {
      $match: filters,
    },
    {
      $project: {
        _id: 1,
        name: 1,
        area: 1,
        area_unit: 1,
        category: 1,
      },
    },
  ];

  const block = await Block.aggregate(pipeline).exec();

  // res.json(notesWithUser);
  res.status(200).json({ message: "List of found blocks", data: block });
  // res.status(201).json({ messaage: `New Block ${block.name} created` });
});

//@desc Get single Block
//@route GET /block/:id
//@access private
const getBlockById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({ message: "Please provide block id" });
  }
  const block = await Block.findById(id);
  if (!block) {
    return res.status(404).json({ message: "No block found" });
  }

  // res.json(notesWithUser);
  res.status(200).json({ message: "Found plot", data: block });
  // res.status(201).json({ messaage: `New Block ${block.name} created` });
});

//@desc  Create new Block
//@route POST /blocks
//@access private
const createNewBlock = asyncHandler(async (req, res) => {
  const { name, area, area_unit, category } = req.body;
  // Validate
  if (!name || !area || !area_unit || !category) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let allowedUnits = [enums.area_unit.kanal, enums.area_unit.marla];
  let allowedCategory = [enums.category.commercial, enums.category.residential];

  if (allowedUnits.indexOf(area_unit) < 0) {
    res.status(400).json({ message: "Invalid unit for area!" });
  }
  if (allowedCategory.indexOf(category) < 0) {
    res.status(400).json({ message: "Invalid plot category!" });
  }

  // Check for duplicate title
  const duplicate = await Block.findOne({ name }).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate block title" });
  }

  //Create note object
  const blockObject = { name, area, area_unit, category };

  //Create a new Note
  const block = await Block.create(blockObject);
  console.log(block);
  if (block) {
    res
      .status(201)
      .json({ messaage: `New Block ${block.name} created`, data: block });
  } else {
    res.status(400).json({ message: "Invalid block data received!" });
  }
});

//@desc  Update Block
//@route Patch /blocks
//@access private
const updateBlock = asyncHandler(async (req, res) => {
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

//@desc Delete a Block
//@route DELETE /blocks
//@access private
const deleteBlock = asyncHandler(async (req, res) => {
  const { _id } = req.body;
  //Validate fields
  if (!_id) {
    return res.status(400).json({ message: "Block ID Required" });
  }
  //Find Note
  const block = await Block.findById(_id).exec();
  if (!block) {
    return res.status(400).json({ message: "Block not found!" });
  }
  //Delete Note
  const result = await block.deleteOne();
  const reply = `Block ${result.name} deleted`;
  res.json({ message: reply });
});

module.exports = {
  getAllBlocks,
  getBlockById,
  createNewBlock,
  updateBlock,
  deleteBlock,
};
