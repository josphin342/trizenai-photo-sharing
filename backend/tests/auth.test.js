const request = require("supertest");
const bcrypt = require("bcryptjs");

const app = require("../server");
const User = require("../models/User");

describe("Authentication", () => {
  test("should register a new Admin", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Admin",
        email: "testadmin@example.com",
        password: "TestAdmin@123",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.user.role).toBe("ADMIN");

    const user = await User.findOne({
      email: "testadmin@example.com",
    });

    expect(user).not.toBeNull();
    expect(user.role).toBe("ADMIN");
  });

  test("should login with valid credentials", async () => {
    const hashedPassword = await bcrypt.hash(
  "LoginAdmin@123",
  12
);

await User.create({
  name: "Login Admin",
  email: "loginadmin@example.com",
  password: hashedPassword,
  role: "ADMIN",
});

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "loginadmin@example.com",
        password: "LoginAdmin@123",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.token).toBeDefined();

    expect(response.body.user.email).toBe(
      "loginadmin@example.com"
    );

    expect(response.body.user.role).toBe("ADMIN");
  });

  test("should reject invalid password", async () => {
    await User.create({
      name: "Invalid Password User",
      email: "invalid@example.com",
      password: "CorrectPass@123",
      role: "ADMIN",
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "invalid@example.com",
        password: "WrongPass@123",
      });

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

    test("should reject access to protected route without token", async () => {
    const response = await request(app)
      .get("/api/events/my-events");

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

  test("should reject Team Member from Admin-only route", async () => {
    const hashedPassword = await bcrypt.hash(
      "TeamMember@123",
      12
    );

    await User.create({
      name: "Test Team Member",
      email: "teamtest@example.com",
      password: hashedPassword,
      role: "TEAM_MEMBER",
    });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "teamtest@example.com",
        password: "TeamMember@123",
      });

    expect(loginResponse.statusCode).toBe(200);

    const token = loginResponse.body.token;

    const response = await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${token}`)
    .send({
    name: "Unauthorized Event",
    description: "Should fail",
  });

    expect(response.statusCode).toBe(403);

    expect(response.body.success).toBe(false);
  });
});