require("dotenv").config();

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const connectDB = require("../config/db");
const Photo = require("../models/Photo");

const {
  uploadToS3,
} = require("../services/s3Service");

const migratePhotos = async () => {
  try {
    await connectDB();

    console.log("Connected to MongoDB");
    console.log("Starting local photo migration to S3...\n");

    const photos = await Photo.find({});

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const photo of photos) {
      const storageLocation =
        photo.storageLocation;

      // Skip photos that are already stored in S3
      if (
        typeof storageLocation === "string" &&
        storageLocation.startsWith("photos/")
      ) {
        console.log(
          `SKIPPED: ${photo.filename} - already in S3`
        );

        skipped++;
        continue;
      }

      if (!storageLocation) {
        console.log(
          `FAILED: ${photo.filename} - no storage location`
        );

        failed++;
        continue;
      }

      const filePath = path.resolve(
        storageLocation
      );

      // Check that the old local file exists
      if (!fs.existsSync(filePath)) {
        console.log(
          `FAILED: ${photo.filename} - local file not found`
        );
        console.log(`Path: ${filePath}\n`);

        failed++;
        continue;
      }

      try {
        const fileBuffer =
          fs.readFileSync(filePath);

        const extension =
          path.extname(photo.filename) ||
          path.extname(filePath);

        const key = `photos/${photo.event}/${crypto.randomUUID()}${extension}`;

        // Upload existing file to S3
        await uploadToS3({
          buffer: fileBuffer,
          key,
          contentType:
            photo.mimeType || "application/octet-stream",
        });

        // Update ONLY the S3 location
        await Photo.updateOne(
          { _id: photo._id },
          {
            $set: {
              storageLocation: key,
            },
          }
        );

        console.log(
          `MIGRATED: ${photo.filename}`
        );
        console.log(`S3 Key: ${key}\n`);

        migrated++;
      } catch (error) {
        console.error(
          `FAILED: ${photo.filename}`,
          error.message
        );

        failed++;
      }
    }

    console.log("\n------------------------------");
    console.log("Migration completed");
    console.log("------------------------------");
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped:  ${skipped}`);
    console.log(`Failed:   ${failed}`);
    console.log("------------------------------\n");

    process.exit(0);
  } catch (error) {
    console.error(
      "Migration error:",
      error
    );

    process.exit(1);
  }
};

migratePhotos();