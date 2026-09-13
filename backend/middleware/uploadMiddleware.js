const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const allowedTypes = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const allowedExtensions =
    allowedTypes[file.mimetype] || [];

  if (allowedExtensions.includes(extension)) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPEG, PNG, and WebP images are allowed"
    ),
    false
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 20,
  },
});

module.exports = { upload };