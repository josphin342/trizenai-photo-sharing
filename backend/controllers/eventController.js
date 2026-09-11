const Event = require("../models/Event");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const createEvent = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required field
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Event name is required",
      });
    }

    // Create event
    const event = await Event.create({
      name,
      description,
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

    return res.status(500).json({
      success: false,
      message: "Server error while creating event",
    });
  }
};

const addTeamMember = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
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
    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to manage this event",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create Team Member
    const teamMember = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "TEAM_MEMBER",
      assignedEvents: [event._id],
    });

    // Add Team Member to Event
    event.teamMembers.push(teamMember._id);
    await event.save();

    return res.status(201).json({
      success: true,
      message: "Team Member added successfully",
      teamMember: {
        id: teamMember._id,
        name: teamMember.name,
        email: teamMember.email,
        role: teamMember.role,
      },
      event: {
        id: event._id,
        name: event.name,
      },
    });
  } catch (error) {
    console.error("Add Team Member error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while adding Team Member",
    });
  }
};

//Team member Assigned Events
const getMyEvents = async (req, res) => {
  try {
    let events;

    if (req.user.role === "ADMIN") {
      // Admin sees events created by them
      events = await Event.find({
        createdBy: req.user._id,
      }).populate("teamMembers", "name email role");
    } else {
      // Team Member sees only events assigned to them
      events = await Event.find({
        teamMembers: req.user._id,
      }).populate("createdBy", "name email");
    }

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Get events error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching events",
    });
  }
};

module.exports = {
  createEvent,
  addTeamMember,
  getMyEvents,
};