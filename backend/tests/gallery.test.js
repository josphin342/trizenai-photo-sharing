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
const Gallery = require("../models/Gallery");

describe("Gallery and PIN Protection", () => {
  let admin;
  let teamMember;
  let event;
  let photo;

  let adminToken;
  let gallery;

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
      name: "Gallery Admin",
      email: `gallery-admin-${Date.now()}@example.com`,
      password: adminPassword,
      role: "ADMIN",
    });

    teamMember = await User.create({
      name: "Gallery Team Member",
      email: `gallery-member-${Date.now()}@example.com`,
      password: teamPassword,
      role: "TEAM_MEMBER",
    });

    event = await Event.create({
      name: "Gallery Test Event",
      description: "Gallery authorization test",
      createdBy: admin._id,
      teamMembers: [teamMember._id],
    });

    await User.findByIdAndUpdate(teamMember._id, {
      assignedEvents: [event._id],
    });

    photo = await Photo.create({
      event: event._id,
      uploadedBy: teamMember._id,
      filename: "gallery-photo.jpg",
      storageLocation: "photos/test/gallery-photo.jpg",
      fileSize: 1000,
      mimeType: "image/jpeg",
      selected: true,
    });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: admin.email,
        password: "Admin@123",
      });

    adminToken = loginResponse.body.token;
  });

  test("Admin should create a gallery with selected photos", async () => {
    const response = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.gallery).toBeDefined();

    expect(response.body.gallery.isPublished).toBe(
      false
    );

    expect(
      response.body.gallery.selectedPhotos
    ).toHaveLength(1);
  });

  test("Admin should not create a gallery with an unselected photo", async () => {
    photo.selected = false;
    await photo.save();

    const response = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "All gallery photos must be selected by the Admin"
    );
  });

  test("Team Member should not create a gallery", async () => {
    const teamLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: teamMember.email,
        password: "Team@123",
      });

    const teamToken = teamLogin.body.token;

    const response = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${teamToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    expect(response.statusCode).toBe(403);

    expect(response.body.success).toBe(false);
  });

  test("Admin should publish a created gallery", async () => {
    const createResponse = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    expect(createResponse.statusCode).toBe(201);

    const galleryId =
      createResponse.body.gallery.id;

    const response = await request(app)
      .patch(
        `/api/galleries/${event._id}/${galleryId}/publish`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(
      response.body.gallery.isPublished
    ).toBe(true);
  });

  test("Correct PIN should provide gallery access token", async () => {
    const createResponse = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    gallery = createResponse.body.gallery;

    const publishResponse = await request(app)
      .patch(
        `/api/galleries/${event._id}/${gallery.id}/publish`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(publishResponse.statusCode).toBe(200);

    const response = await request(app)
      .post(
        `/api/galleries/public/${gallery.shareToken}/verify`
      )
      .send({
        pin: "123456",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.accessToken).toBeDefined();
  });

  test("Incorrect PIN should be rejected", async () => {
    const createResponse = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    gallery = createResponse.body.gallery;

    await request(app)
      .patch(
        `/api/galleries/${event._id}/${gallery.id}/publish`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    const response = await request(app)
      .post(
        `/api/galleries/public/${gallery.shareToken}/verify`
      )
      .send({
        pin: "999999",
      });

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);

    expect(response.body.message).toBe(
      "Incorrect gallery PIN"
    );

    expect(response.body.accessToken).toBeUndefined();
  });

  test("Unpublished gallery should not be publicly accessible", async () => {
    const createResponse = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    gallery = createResponse.body.gallery;

    const response = await request(app)
      .post(
        `/api/galleries/public/${gallery.shareToken}/verify`
      )
      .send({
        pin: "123456",
      });

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);
  });

  test("Customer should access published gallery with valid gallery token", async () => {
    const createResponse = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    gallery = createResponse.body.gallery;

    await request(app)
      .patch(
        `/api/galleries/${event._id}/${gallery.id}/publish`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    const pinResponse = await request(app)
      .post(
        `/api/galleries/public/${gallery.shareToken}/verify`
      )
      .send({
        pin: "123456",
      });

    const accessToken =
      pinResponse.body.accessToken;

    const response = await request(app)
      .get(
        `/api/galleries/public/${gallery.shareToken}/photos`
      )
      .set(
        "Authorization",
        `Bearer ${accessToken}`
      );

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.count).toBe(1);

    expect(response.body.photos[0]._id).toBe(
      photo._id.toString()
    );
  });

  test("Normal user JWT should not access customer gallery", async () => {
    const createResponse = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    gallery = createResponse.body.gallery;

    await request(app)
      .patch(
        `/api/galleries/${event._id}/${gallery.id}/publish`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    const response = await request(app)
      .get(
        `/api/galleries/public/${gallery.shareToken}/photos`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });
    test("Admin should update photos in an unpublished gallery", async () => {
    const secondPhoto = await Photo.create({
      event: event._id,
      uploadedBy: teamMember._id,
      filename: "gallery-photo-2.jpg",
      storageLocation: "photos/test/gallery-photo-2.jpg",
      fileSize: 2000,
      mimeType: "image/jpeg",
      selected: true,
    });

    const createResponse = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    expect(createResponse.statusCode).toBe(201);

    const galleryId =
      createResponse.body.gallery.id;

    const updateResponse = await request(app)
      .patch(
        `/api/galleries/${event._id}/${galleryId}/photos`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        selectedPhotos: [
          secondPhoto._id.toString(),
        ],
      });

    expect(updateResponse.statusCode).toBe(200);

    expect(updateResponse.body.success).toBe(true);

    expect(
      updateResponse.body.gallery.selectedPhotos
    ).toHaveLength(1);

    expect(
      updateResponse.body.gallery.selectedPhotos[0].toString()
    ).toBe(secondPhoto._id.toString());

    expect(
      updateResponse.body.gallery.isPublished
    ).toBe(false);
  });

  test("Admin should not update gallery with an unselected photo", async () => {
    const secondPhoto = await Photo.create({
      event: event._id,
      uploadedBy: teamMember._id,
      filename: "gallery-photo-2.jpg",
      storageLocation: "photos/test/gallery-photo-2.jpg",
      fileSize: 2000,
      mimeType: "image/jpeg",
      selected: false,
    });

    const createResponse = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    expect(createResponse.statusCode).toBe(201);

    const galleryId =
      createResponse.body.gallery.id;

    const updateResponse = await request(app)
      .patch(
        `/api/galleries/${event._id}/${galleryId}/photos`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        selectedPhotos: [
          secondPhoto._id.toString(),
        ],
      });

    expect(updateResponse.statusCode).toBe(400);

    expect(updateResponse.body.success).toBe(false);

    expect(
      updateResponse.body.message
    ).toBe(
      "Only photos selected by the Admin can be added to the gallery"
    );
  });

  test("Published gallery should not allow photo updates", async () => {
    const createResponse = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    expect(createResponse.statusCode).toBe(201);

    const galleryId =
      createResponse.body.gallery.id;

    const publishResponse = await request(app)
      .patch(
        `/api/galleries/${event._id}/${galleryId}/publish`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(publishResponse.statusCode).toBe(200);

    const updateResponse = await request(app)
      .patch(
        `/api/galleries/${event._id}/${galleryId}/photos`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        selectedPhotos: [photo._id.toString()],
      });

    expect(updateResponse.statusCode).toBe(400);

    expect(updateResponse.body.success).toBe(false);

    expect(
      updateResponse.body.message
    ).toBe(
      "Published galleries cannot be modified"
    );
  });

  test("Team Member should not update gallery photos", async () => {
    const createResponse = await request(app)
      .post(`/api/galleries/${event._id}`)
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        pin: "123456",
        selectedPhotos: [photo._id.toString()],
      });

    expect(createResponse.statusCode).toBe(201);

    const galleryId =
      createResponse.body.gallery.id;

    const teamLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: teamMember.email,
        password: "Team@123",
      });

    const teamToken = teamLogin.body.token;

    const response = await request(app)
      .patch(
        `/api/galleries/${event._id}/${galleryId}/photos`
      )
      .set(
        "Authorization",
        `Bearer ${teamToken}`
      )
      .send({
        selectedPhotos: [photo._id.toString()],
      });

    expect(response.statusCode).toBe(403);

    expect(response.body.success).toBe(false);
  });
});