const request = require("supertest");
const bcrypt = require("bcryptjs");

jest.mock("../services/s3Service", () => ({
  uploadToS3: jest.fn().mockResolvedValue("photos/test/photo.jpg"),
  getS3SignedUrl: jest
    .fn()
    .mockResolvedValue("https://example.com/test-photo.jpg"),
  deleteFromS3: jest.fn().mockResolvedValue(),
}));

const app = require("../server");

const User = require("../models/User");
const Event = require("../models/Event");
const Photo = require("../models/Photo");

describe("Photo Access Controls", () => {
  let admin;
  let teamMember;
  let anotherTeamMember;
  let event;

  let adminToken;
  let teamMemberToken;
  let anotherTeamMemberToken;

  beforeEach(async () => {
    const adminPassword = await bcrypt.hash(
      "Admin@123",
      12
    );

    const teamPassword = await bcrypt.hash(
      "Team@123",
      12
    );

    admin = await User.create({
      name: "Photo Admin",
      email: `photo-admin-${Date.now()}@example.com`,
      password: adminPassword,
      role: "ADMIN",
    });

    teamMember = await User.create({
      name: "Photo Team Member",
      email: `photo-member-${Date.now()}@example.com`,
      password: teamPassword,
      role: "TEAM_MEMBER",
    });

    anotherTeamMember = await User.create({
      name: "Another Team Member",
      email: `another-member-${Date.now()}@example.com`,
      password: teamPassword,
      role: "TEAM_MEMBER",
    });

    event = await Event.create({
      name: "Photo Test Event",
      description: "Photo authorization test",
      createdBy: admin._id,
      teamMembers: [
        teamMember._id,
        anotherTeamMember._id,
      ],
    });

    await User.findByIdAndUpdate(teamMember._id, {
      assignedEvents: [event._id],
    });

    await User.findByIdAndUpdate(
      anotherTeamMember._id,
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

    const teamLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: teamMember.email,
        password: "Team@123",
      });

    teamMemberToken = teamLogin.body.token;

    const anotherTeamLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: anotherTeamMember.email,
        password: "Team@123",
      });

    anotherTeamMemberToken =
      anotherTeamLogin.body.token;
  });

  test("Team Member should upload a photo to an assigned event", async () => {
    const response = await request(app)
      .post(`/api/photos/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${teamMemberToken}`
      )
      .attach(
        "photos",
        Buffer.from("fake image data"),
        "test.jpg"
      );

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.count).toBe(1);
  });

  test("Team Member should view their own photo", async () => {
    const photo = await Photo.create({
      event: event._id,
      uploadedBy: teamMember._id,
      filename: "my-photo.jpg",
      storageLocation: "photos/test/my-photo.jpg",
      fileSize: 1000,
      mimeType: "image/jpeg",
      selected: false,
    });

    const response = await request(app)
      .get(
        `/api/photos/${event._id}/${photo._id}`
      )
      .set(
        "Authorization",
        `Bearer ${teamMemberToken}`
      );

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.url).toBe(
      "https://example.com/test-photo.jpg"
    );
  });

  test("Team Member should not view another member's photo", async () => {
    const photo = await Photo.create({
      event: event._id,
      uploadedBy: anotherTeamMember._id,
      filename: "other-photo.jpg",
      storageLocation: "photos/test/other-photo.jpg",
      fileSize: 1000,
      mimeType: "image/jpeg",
      selected: false,
    });

    const response = await request(app)
      .get(
        `/api/photos/${event._id}/${photo._id}`
      )
      .set(
        "Authorization",
        `Bearer ${teamMemberToken}`
      );

    expect(response.statusCode).toBe(403);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "You are not authorized to view this photo"
    );
  });

  test("Admin should view a Team Member's photo", async () => {
    const photo = await Photo.create({
      event: event._id,
      uploadedBy: teamMember._id,
      filename: "team-photo.jpg",
      storageLocation: "photos/test/team-photo.jpg",
      fileSize: 1000,
      mimeType: "image/jpeg",
      selected: false,
    });

    const response = await request(app)
      .get(
        `/api/photos/${event._id}/${photo._id}`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });
});