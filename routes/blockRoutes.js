const express = require("express");
const router = express.Router();
const blocksController = require("../controllers/blocksController");
const { protect } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect, blocksController.getAllBlocks)
  .post(protect, blocksController.createNewBlock)
  .patch(protect, blocksController.updateBlock)
  .delete(protect, blocksController.deleteBlock);

module.exports = router;
