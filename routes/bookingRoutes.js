const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect, bookingController.getAllBookings)
  .post(protect, bookingController.createNewBooking)
  .patch(protect, bookingController.updateBooking)
  .delete(protect, bookingController.deleteBooking);
router.get("/:id", protect, bookingController.getBookingById);

module.exports = router;
