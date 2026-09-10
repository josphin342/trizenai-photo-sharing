const express = require("express");

const {
  uploadPhotos,
  getEventPhotos,
  selectPhoto,
  getPhoto,
} = require("../controllers/photoController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { checkEventAccess } = require("../middleware/eventAccessMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Team Member uploads multiple photos
router.post(
  "/:eventId",
  protect,
  authorizeRoles("TEAM_MEMBER"),
  checkEventAccess,
  upload.array("photos", 20),
  uploadPhotos
);

// Admin gets all photos
// Team Member gets only their own photos
router.get(
  "/:eventId",
  protect,
  authorizeRoles("ADMIN", "TEAM_MEMBER"),
  checkEventAccess,
  getEventPhotos
);

// Admin selects/unselects a photo
router.patch(
  "/:eventId/:photoId/select",
  protect,
  authorizeRoles("ADMIN"),
  checkEventAccess,
  selectPhoto
);

router.get(
  "/:eventId/:photoId",
  protect,
  authorizeRoles("ADMIN", "TEAM_MEMBER"),
  checkEventAccess,
  getPhoto
);

module.exports = router;