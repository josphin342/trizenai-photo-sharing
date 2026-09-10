const express = require("express");

const { 
    createEvent,
    addTeamMember,
    getMyEvents,
 } = require("../controllers/eventController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const { checkEventAccess } = require("../middleware/eventAccessMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("ADMIN"),
  createEvent
);

router.post(
  "/:eventId/members",
  protect,
  authorizeRoles("ADMIN"),
  addTeamMember
);

router.get(
  "/my-events",
  protect,
  authorizeRoles("ADMIN", "TEAM_MEMBER"),
  getMyEvents
);

router.get(
  "/:eventId",
  protect,
  authorizeRoles("ADMIN", "TEAM_MEMBER"),
  checkEventAccess,
  (req, res) => {
    res.status(200).json({
      success: true,
      event: req.event,
    });
  }
);

module.exports = router;