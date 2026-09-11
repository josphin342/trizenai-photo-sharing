const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Gallery = require("../models/Gallery");
const Photo = require("../models/Photo");


const createGallery = async (req, res) => {
  try {
    const { pin, selectedPhotos } = req.body;

    // Validate PIN
    if (!pin) {
      return res.status(400).json({
        success: false,
        message: "Gallery PIN is required",
      });
    }

    if (!/^\d{6}$/.test(String(pin))) {
      return res.status(400).json({
        success: false,
        message: "Gallery PIN must be exactly 6 digits",
      });
    }

    // Validate selected photos
    if (
      !Array.isArray(selectedPhotos) ||
      selectedPhotos.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one photo must be selected",
      });
    }

    // Check whether gallery already exists
    const existingGallery = await Gallery.findOne({
      event: req.event._id,
    });

    if (existingGallery) {
      return res.status(409).json({
        success: false,
        message: "A gallery already exists for this event",
      });
    }

    // Make sure all selected photos belong to this event
    const photos = await Photo.find({
      _id: { $in: selectedPhotos },
      event: req.event._id,
    });

    if (photos.length !== selectedPhotos.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected photos do not belong to this event",
      });
    }

    // Make sure selected photos were actually selected by Admin
    const unselectedPhoto = photos.find(
      (photo) => photo.selected !== true
    );

    if (unselectedPhoto) {
      return res.status(400).json({
        success: false,
        message: "All gallery photos must be selected by the Admin",
      });
    }

    // Hash the Gallery PIN
    const pinHash = await bcrypt.hash(String(pin), 12);

    // Generate random share token
    const shareToken = crypto.randomBytes(32).toString("hex");

    const gallery = await Gallery.create({
      event: req.event._id,
      createdBy: req.user._id,
      selectedPhotos,
      shareToken,
      pinHash,
      isPublished: false,
      publishedAt: null,
    });

    return res.status(201).json({
      success: true,
      message: "Gallery created successfully",
      gallery: {
        id: gallery._id,
        event: gallery.event,
        selectedPhotos: gallery.selectedPhotos,
        shareToken: gallery.shareToken,
        isPublished: gallery.isPublished,
      },
    });
  } catch (error) {
    console.error("Create gallery error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating gallery",
    });
  }
};

const publishGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findOne({
      _id: req.params.galleryId,
      event: req.event._id,
      createdBy: req.user._id,
    });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    if (gallery.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Gallery is already published",
      });
    }

    gallery.isPublished = true;
    gallery.publishedAt = new Date();

    await gallery.save();

    return res.status(200).json({
      success: true,
      message: "Gallery published successfully",
      gallery: {
        id: gallery._id,
        event: gallery.event,
        shareToken: gallery.shareToken,
        isPublished: gallery.isPublished,
        publishedAt: gallery.publishedAt,
      },
    });
  } catch (error) {
    console.error("Publish gallery error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while publishing gallery",
    });
  }
};

const getAdminGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findOne({
      event: req.event._id,
      createdBy: req.user._id,
    });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    return res.status(200).json({
      success: true,
      gallery: {
        id: gallery._id,
        event: gallery.event,
        selectedPhotos: gallery.selectedPhotos,
        shareToken: gallery.shareToken,
        isPublished: gallery.isPublished,
        publishedAt: gallery.publishedAt,
      },
    });
  } catch (error) {
    console.error("Get admin gallery error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading gallery",
    });
  }
};

const verifyGalleryPin = async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        message: "Gallery PIN is required",
      });
    }

    const gallery = await Gallery.findOne({
      shareToken,
      isPublished: true,
    });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found or not published",
      });
    }

    const isPinCorrect = await bcrypt.compare(
      String(pin),
      gallery.pinHash
    );

    if (!isPinCorrect) {
      return res.status(401).json({
        success: false,
        message: "Incorrect gallery PIN",
      });
    }

    const galleryAccessToken = jwt.sign(
      {
        type: "GALLERY_ACCESS",
        galleryId: gallery._id.toString(),
        shareToken: gallery.shareToken,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Gallery PIN verified successfully",
      accessToken: galleryAccessToken,
      gallery: {
        id: gallery._id,
        event: gallery.event,
      },
    });
  } catch (error) {
    console.error("Gallery PIN verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while verifying gallery PIN",
    });
  }
};

const getCustomerGallery = async (req, res) => {
  try {
    const { shareToken } = req.params;

    const gallery = await Gallery.findOne({
      shareToken,
      isPublished: true,
    });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found or not published",
      });
    }

    // Make sure the token belongs to this gallery
    if (
      req.galleryAccess.galleryId !==
      gallery._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this gallery",
      });
    }

    const photos = await Photo.find({
      _id: { $in: gallery.selectedPhotos },
      event: gallery.event,
      selected: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: photos.length,
      photos,
    });
  } catch (error) {
    console.error("Customer gallery error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading gallery",
    });
  }
};

const getCustomerPhoto = async (req, res) => {
  try {
    const { shareToken, photoId } = req.params;

    const gallery = await Gallery.findOne({
      shareToken,
      isPublished: true,
    });

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found or not published",
      });
    }

    if (
      req.galleryAccess.galleryId !==
      gallery._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this gallery",
      });
    }

    const isGalleryPhoto = gallery.selectedPhotos.some(
      (id) => id.toString() === photoId
    );

    if (!isGalleryPhoto) {
      return res.status(403).json({
        success: false,
        message: "This photo is not part of the published gallery",
      });
    }

    const photo = await Photo.findOne({
      _id: photoId,
      event: gallery.event,
      selected: true,
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found",
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
    console.error("Customer photo error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while retrieving photo",
    });
  }
};

module.exports = {
  createGallery,
  getAdminGallery,
  publishGallery,
  verifyGalleryPin,
  getCustomerGallery,
  getCustomerPhoto,
};
  
