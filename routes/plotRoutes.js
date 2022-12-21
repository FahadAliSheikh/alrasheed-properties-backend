const express = require("express");
const router = express.Router();
const plotsController = require("../controllers/plotsController");
const { protect } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect, plotsController.getAllPlots)
  .post(protect, plotsController.createNewPlot)
  .patch(protect, plotsController.updatePlot)
  .delete(protect, plotsController.deletePlot);

module.exports = router;
