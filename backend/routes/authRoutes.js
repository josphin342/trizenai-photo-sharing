const express = require("express");

const {
  register,
  login,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

router.get(
  "/admin-test",
  protect,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin authorization successful",
      user: req.user,
    });
  }
);

module.exports = router;