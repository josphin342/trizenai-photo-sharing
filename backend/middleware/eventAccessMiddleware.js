const mongoose = require("mongoose");
const Event = require("../models/Event");

const checkEventAccess = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Validate event ID before querying MongoDB
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Make sure authenticated user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ADMIN
    // Admin can access only events created by them
    if (req.user.role === "ADMIN") {
      if (
        !event.createdBy ||
        event.createdBy.toString() !==
          req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to access this event",
        });
      }
    }

    // TEAM MEMBER
    // Team Member can access only assigned events
    if (req.user.role === "TEAM_MEMBER") {
      const isAssigned = (event.teamMembers || []).some(
        (memberId) =>
          memberId.toString() ===
          req.user._id.toString()
      );

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message:
            "You are not assigned to this event",
        });
      }
    }

    // Unknown role
    if (
      req.user.role !== "ADMIN" &&
      req.user.role !== "TEAM_MEMBER"
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid user role",
      });
    }

    // Attach event for controllers
    req.event = event;

    next();
  } catch (error) {
    console.error("Event access error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while checking event access",
    });
  }
};

module.exports = { checkEventAccess };