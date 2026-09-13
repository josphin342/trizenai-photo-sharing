const jwt = require("jsonwebtoken");

const protectGalleryAccess = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Gallery access required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.type !== "GALLERY_ACCESS") {
      return res.status(401).json({
        success: false,
        message: "Invalid gallery access token",
      });
    }

    req.galleryAccess = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Gallery access has expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid gallery access token",
      });
    }

    console.error("Gallery access error:", error);

    return res.status(500).json({
      success: false,
      message: "Gallery access verification failed",
    });
  }
};

module.exports = {
  protectGalleryAccess,
};