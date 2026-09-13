const Photo = require("../models/Photo");
const {
  uploadToS3,
  getS3SignedUrl,
  deleteFromS3,
} = require("../services/s3Service");

const crypto = require("crypto");
const path = require("path");

const uploadPhotos = async (req, res) => {
  const uploadedKeys = [];
  const createdPhotoIds = [];

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one photo",
      });
    }

    const photos = [];

    for (const file of req.files) {
      const extension = path.extname(file.originalname);

      const key = `photos/${req.event._id}/${crypto.randomUUID()}${extension}`;

      await uploadToS3({
        buffer: file.buffer,
        key,
        contentType: file.mimetype,
      });

      uploadedKeys.push(key);
      

      const photo = await Photo.create({
        event: req.event._id,
        uploadedBy: req.user._id,
        filename: file.originalname,
        storageLocation: key,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      createdPhotoIds.push(photo._id);

      photos.push(photo);
    }

    return res.status(201).json({
      success: true,
      message: `${photos.length} photo(s) uploaded successfully`,
      count: photos.length,
      photos,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    
   // Delete MongoDB Photo records created during this upload
    for (const photoId of createdPhotoIds) {
  try {
    await Photo.findByIdAndDelete(photoId);
  } catch (deleteError) {
    console.error(
      "Failed to clean up Photo database record:",
      photoId,
      deleteError
    );
  }
}

    // Delete S3 objects if the database operation fails
    for (const key of uploadedKeys) {
      try {
        await deleteFromS3(key);
      } catch (deleteError) {
        console.error(
          "Failed to clean up S3 object:",
          key,
          deleteError
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Server error while uploading photos",
    });
  }
};

const getEventPhotos = async (req, res) => {
  try {
    let query = {
      event: req.event._id,
    };

    // Team Member can see only their own photos
    if (req.user.role === "TEAM_MEMBER") {
      query.uploadedBy = req.user._id;
    }

    const photos = await Photo.find(query)
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: photos.length,
      photos,
    });
  } catch (error) {
    console.error("Get photos error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching photos",
    });
  }
};

const selectPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { selected } = req.body;

    if (typeof selected !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "selected must be true or false",
      });
    }

    const photo = await Photo.findOne({
      _id: photoId,
      event: req.event._id,
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found in this event",
      });
    }

    photo.selected = selected;

    await photo.save();

    return res.status(200).json({
      success: true,
      message: selected
        ? "Photo selected successfully"
        : "Photo unselected successfully",
      photo,
    });
  } catch (error) {
    console.error("Select photo error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while selecting photo",
    });
  }
};

const getPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    const photo = await Photo.findOne({
      _id: photoId,
      event: req.event._id,
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found in this event",
      });
    }

    // Team Member can only view their own photos
    if (
      req.user.role === "TEAM_MEMBER" &&
      photo.uploadedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this photo",
      });
    }

    const signedUrl = await getS3SignedUrl(
      photo.storageLocation
    );

    return res.status(200).json({
      success: true,
      url: signedUrl,
    });
  } catch (error) {
    console.error("Get photo error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while retrieving photo",
    });
  }
};

module.exports = {
  uploadPhotos,
  getEventPhotos,
  selectPhoto,
  getPhoto,
};