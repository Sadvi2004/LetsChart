const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Status = require("../models/Status");
const { response } = require("../utils/responseHandler");

// Create a status
exports.CreateStatus = async (req, res) => {
    try {
        const { content, contentType } = req.body;
        const userId = req.user.userId;
        const file = req.file;

        let mediaUrl = null;
        let finalContentType = contentType || "text";

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
            return res.status(400).json({ message: "Status content is required" });
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const status = new Status({
            user: userId,
            content: mediaUrl || content,
            contentType: finalContentType,
            expiresAt,
        });

        await status.save();

        const populatedStatus = await Status.findById(status._id)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture");

        // Emit socket event
        if (req.io && req.socketUserMap) {
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit("new_status", populatedStatus);
                }
            }
        }

        return res.status(201).json({
            message: "Status created successfully",
            data: populatedStatus,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get all active statuses
exports.getStatus = async (req, res) => {
    try {
        const statuses = await Status.find({
            expiresAt: { $gt: new Date() },
        })
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture")
            .sort({ createdAt: -1 });

        return response(res, 200, "Status retrieved successfully", statuses);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// View a status
exports.viewStatus = async (req, res) => {
    const { statusId } = req.params;
    const userId = req.user.userId;

    try {
        const status = await Status.findById(statusId);
        if (!status) {
            return response(res, 404, "Status not found");
        }

        let updatedStatus = await Status.findById(statusId)
            .populate("user", "username profilePicture")
            .populate("viewers", "username profilePicture");

        if (!status.viewers.includes(userId)) {
            status.viewers.push(userId);
            await status.save();

            updatedStatus = await Status.findById(statusId)
                .populate("user", "username profilePicture")
                .populate("viewers", "username profilePicture");

            // Emit socket event to status owner
            if (req.io && req.socketUserMap) {
                const statusOwnerSocketId = req.socketUserMap.get(status.user.toString());
                if (statusOwnerSocketId) {
                    const viewData = {
                        statusId,
                        viewerId: userId,
                        totalViewers: updatedStatus.viewers.length,
                        viewers: updatedStatus.viewers,
                    };
                    req.io.to(statusOwnerSocketId).emit("status_viewed", viewData);
                } else {
                    console.log("Status owner not connected");
                }
            }
        } else {
            console.log("User already viewed the status");
        }

        return response(res, 200, "Status viewed successfully", updatedStatus);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Delete a status
exports.deleteStatus = async (req, res) => {
    const { statusId } = req.params; // or req.params if you prefer
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

        // Emit socket event
        if (req.io && req.socketUserMap) {
            for (const [connectedUserId, socketId] of req.socketUserMap) {
                if (connectedUserId !== userId) {
                    req.io.to(socketId).emit("status_deleted", statusId);
                }
            }
        }

        return response(res, 200, "Status deleted successfully");
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};