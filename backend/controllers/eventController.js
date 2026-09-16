const Event = require("../models/Event");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createEvent = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required field
    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Event name is required",
      });
    }

    const normalizedName = String(name).trim();
    const normalizedDescription =
      description
        ? String(description).trim()
        : "";

    // Validate event name length
    if (
      normalizedName.length < 2 ||
      normalizedName.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Event name must be between 2 and 100 characters",
      });
    }

    // Validate description length
    if (normalizedDescription.length > 500) {
      return res.status(400).json({
        success: false,
        message:
          "Description cannot exceed 500 characters",
      });
    }

    // Create event
    const event = await Event.create({
      name: normalizedName,
      description: normalizedDescription,
      createdBy: req.user._id,
      teamMembers: [],
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);

    if (error.name === "ValidationError") {
      const firstError = Object.values(
        error.errors
      )[0];

      return res.status(400).json({
        success: false,
        message:
          firstError?.message ||
          "Invalid event data",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating event",
    });
  }
};

const addTeamMember = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const normalizedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    // Validate name
    if (
      normalizedName.length < 2 ||
      normalizedName.length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 50 characters",
      });
    }

    // Validate email
    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate password only when creating a new user
    if (password && String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Find event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Make sure the logged-in Admin owns this event
    if (
      event.createdBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to manage this event",
      });
    }

    // Check if user already exists
    let user = await User.findOne({
      email: normalizedEmail,
    });

    // =====================================================
    // EXISTING USER
    // =====================================================
    if (user) {
      // Existing user must be a Team Member
      if (user.role !== "TEAM_MEMBER") {
        return res.status(400).json({
          success: false,
          message:
            "This email belongs to an Admin and cannot be assigned as a Team Member",
        });
      }

      // Check if already assigned to this event
      const alreadyAssigned = event.teamMembers.some(
        (memberId) =>
          memberId.toString() === user._id.toString()
      );

      if (alreadyAssigned) {
        return res.status(409).json({
          success: false,
          message:
            "This Team Member is already assigned to this event",
        });
      }

      // Add event to user's assignedEvents
      const alreadyInAssignedEvents =
        user.assignedEvents.some(
          (assignedEventId) =>
            assignedEventId.toString() ===
            event._id.toString()
        );

      if (!alreadyInAssignedEvents) {
        user.assignedEvents.push(event._id);
      }

      // Add user to event's teamMembers
      event.teamMembers.push(user._id);

      await user.save();
      await event.save();

      return res.status(200).json({
        success: true,
        message:
          "Existing Team Member assigned successfully",
        existingUser: true,
        teamMember: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        event: {
          id: event._id,
          name: event.name,
        },
      });
    }

    // =====================================================
    // NEW USER
    // =====================================================

    // Password is required for a new Team Member
    if (!password) {
      return res.status(400).json({
        success: false,
        message:
          "Password is required when creating a new Team Member",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      String(password),
      12
    );

    // Create Team Member
    user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "TEAM_MEMBER",
      assignedEvents: [event._id],
    });

    // Add Team Member to Event
    event.teamMembers.push(user._id);
    await event.save();

    return res.status(201).json({
      success: true,
      message:
        "Team Member created and assigned successfully",
      existingUser: false,
      teamMember: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      event: {
        id: event._id,
        name: event.name,
      },
    });
  } catch (error) {
    console.error(
      "Add Team Member error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      const firstError = Object.values(
        error.errors
      )[0];

      return res.status(400).json({
        success: false,
        message:
          firstError?.message ||
          "Invalid team member data",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while adding Team Member",
    });
  }
};

// Team Member Assigned Events
const getMyEvents = async (req, res) => {
  try {
    let events;

    if (req.user.role === "ADMIN") {
      // Admin sees events created by them
      events = await Event.find({
        createdBy: req.user._id,
      }).populate(
        "teamMembers",
        "name email role"
      );
    } else {
      // Team Member sees only events assigned to them
      events = await Event.find({
        teamMembers: req.user._id,
      }).populate(
        "createdBy",
        "name email"
      );
    }

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error(
      "Get events error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching events",
    });
  }
};

module.exports = {
  createEvent,
  addTeamMember,
  getMyEvents,
};