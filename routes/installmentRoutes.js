const express = require("express");
const router = express.Router();
const installmentController = require("../controllers/installmentController");
const { protect } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect, installmentController.getAllInstallments)
  .post(protect, installmentController.createNewInstallment)
  .patch(protect, installmentController.updateInstallment)
  .delete(protect, installmentController.deleteInstallment);
router.get("/:id", protect, installmentController.getInstallmentById);

module.exports = router;
