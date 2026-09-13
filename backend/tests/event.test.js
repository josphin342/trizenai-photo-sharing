const request = require("supertest");
const bcrypt = require("bcryptjs");

const app = require("../server");

const User = require("../models/User");
const Event = require("../models/Event");

describe("Event Authorization", () => {
  let admin;
  let assignedMember;
  let unassignedMember;
  let event;

  let adminToken;
  let assignedMemberToken;
  let unassignedMemberToken;

  beforeEach(async () => {
    const hashedAdminPassword = await bcrypt.hash(
      "Admin@123",
      12
    );

    const hashedTeamPassword = await bcrypt.hash(
      "Team@123",
      12
    );

    admin = await User.create({
      name: "Test Admin",
      email: `admin${Date.now()}@example.com`,
      password: hashedAdminPassword,
      role: "ADMIN",
    });

    assignedMember = await User.create({
      name: "Assigned Member",
      email: `assigned${Date.now()}@example.com`,
      password: hashedTeamPassword,
      role: "TEAM_MEMBER",
    });

    unassignedMember = await User.create({
      name: "Unassigned Member",
      email: `unassigned${Date.now()}@example.com`,
      password: hashedTeamPassword,
      role: "TEAM_MEMBER",
    });

    event = await Event.create({
      name: "Test Wedding",
      description: "Authorization Test Event",
      createdBy: admin._id,
      teamMembers: [assignedMember._id],
    });

    await User.findByIdAndUpdate(
      assignedMember._id,
      {
        assignedEvents: [event._id],
      }
    );

    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: admin.email,
        password: "Admin@123",
      });

    adminToken = adminLogin.body.token;

    const assignedLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: assignedMember.email,
        password: "Team@123",
      });

    assignedMemberToken = assignedLogin.body.token;

    const unassignedLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: unassignedMember.email,
        password: "Team@123",
      });

    unassignedMemberToken = unassignedLogin.body.token;
  });

  test("Admin should access their own event", async () => {
    const response = await request(app)
      .get(`/api/events/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  test("Assigned Team Member should access the event", async () => {
    const response = await request(app)
      .get(`/api/events/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${assignedMemberToken}`
      );

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  test("Unassigned Team Member should be denied access", async () => {
    const response = await request(app)
      .get(`/api/events/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${unassignedMemberToken}`
      );

    expect(response.statusCode).toBe(403);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "You are not assigned to this event"
    );
  });
});