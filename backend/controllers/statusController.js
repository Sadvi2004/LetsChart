const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Status = require("../models/Status");
const reponse = require("../utils/responseHandler");
const Message = require("../models/Message");
const { response } = require("express");

// Send a message
exports.CreateStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body;
        const userId = req.user.userId;
        const file = req.file;

        let mediaUrl = null;
        let finalContentType = contentType || 'text';

        // Handle file upload
        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);
            if (!uploadFile?.secure_url) {
                return res.status(400).json({ message: "Failed to upload media" });
            }
            mediaUrl = uploadFile.secure_url;

            if (file.mimetype.startsWith("image")) {
                finalContentType = "image";
            } else if (file.mimetype.startsWith("video")) {
                finalContentType = "video";
            } else {
                return res.status(400).json({ message: "Unsupported file type" });
            }
        } else if (content?.trim()) {
            finalContentType = "text";
        } else {
            return res.status(400).json({ message: "Message content is required" });
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const status = new Status({
            user: userId,
            content: mediaUrl || content,
            contentType: finalContentType,
            imageOrVideoUrl,
            messageStatus,
        });

        await status.save();

        const populatedStatus = await Message.findById(status._id)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture");

        return res.status(201).json({
            message: "Status created successfully",
            data: populatedStatus,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get status
exports.getStatus = async (req, res) => {
    try {
        const statuses = await Status.find({
            expiresAt: { $gt: new Date() }
        }).populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture").sort({ createdAt: -1 });

        return response(res, 200, "Status retrived successfully", statuses)
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// How many people viewed status
exports.viewStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user.userId;
    try {
        const status = await Status.findById(statusId);
        if (!status) {
            return response(res, 404, "Status not found");
        }
        if (!status.viewers.includes(userId)) {
            status.viewers.push(userId);
            await status.save();

            const updatedStatus = await Status.FindById(statusId)
                .populate("user", "username profilePicture")
                .populate("viewers", "username profilePicture");
        } else {
            console.log('user already viewed the status');
        }
        return response(res, 200, "Status viewed successfully");
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Delete a status
exports.deleteStatus = async (req, res) => {
    const { statusId } = req.body;
    const userId = req.user.userId;
    try {
        const status = await Status.findById(statusId);
        if (!status) {
            return response(res, 404, "Status not found");
        }
        if (status.user.toString() !== userId) {
            return response(res, 403, "Not authorized to delete this status");
        }
        await status.deleteOne();
        return response(res, 200, "Status deleted successfully");
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};