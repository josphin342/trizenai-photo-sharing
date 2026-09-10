const express = require("express");

const {
  createGallery,
  getAdminGallery,
  publishGallery,
  verifyGalleryPin,
  getCustomerGallery,
  getCustomerPhoto,
} = require("../controllers/galleryController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { checkEventAccess } = require("../middleware/eventAccessMiddleware");

const {
  protectGalleryAccess,
} = require("../middleware/galleryAccessMiddleware");


const router = express.Router();

// Admin gets existing gallery

router.get(
  "/:eventId",
  protect,
  authorizeRoles("ADMIN"),
  checkEventAccess,
  getAdminGallery
);

// Create gallery
router.post(
  "/:eventId",
  protect,
  authorizeRoles("ADMIN"),
  checkEventAccess,
  createGallery
);

// Publish gallery
router.patch(
  "/:eventId/:galleryId/publish",
  protect,
  authorizeRoles("ADMIN"),
  checkEventAccess,
  publishGallery
);

// Customer verifies Gallery PIN
router.post(
  "/public/:shareToken/verify",
  verifyGalleryPin
);

// Customer retrieves published gallery
router.get(
  "/public/:shareToken/photos",
  protectGalleryAccess,
  getCustomerGallery
);

router.get(
  "/public/:shareToken/photos/:photoId",
  protectGalleryAccess,
  getCustomerPhoto
);

module.exports = router;