const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const fs = require("fs");

// Load environment variables
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFileToCloudinary = (file) => {
    const isVideo = file.mimetype.startsWith("video");
    const options = {
        resource_type: isVideo ? "video" : "image",
    };

    return new Promise((resolve, reject) => {
        const uploader = isVideo ? cloudinary.uploader.upload_large : cloudinary.uploader.upload;

        uploader(file.path, options, (error, result) => {
            // Delete local file after upload
            fs.unlink(file.path, (unlinkErr) => {
                if (unlinkErr) {
                    console.error("Error deleting local file:", unlinkErr);
                }
            });

            if (error) {
                return reject(error);
            }
            resolve(result);
        });
    });
};

const multerMiddleware = multer({ dest: "uploads/" }).single("media");

module.exports = {
    uploadFileToCloudinary,
    multerMiddleware
};