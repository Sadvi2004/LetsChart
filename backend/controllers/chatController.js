const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, content, messageStatus } = req.body;
        const file = req.file;

        const participants = [senderId, receiverId].sort();

        // Check if conversation already exists
        let conversation = await Conversation.findOne({ participants: { $all: participants } });
        if (!conversation) {
            conversation = new Conversation({ participants });
            await conversation.save();
        }

        let imageOrVideoUrl = null;
        let contentType = null;

        // Handle file upload
        if (file) {
            const uploadFile = await uploadFileToCloudinary(file);
            if (!uploadFile?.secure_url) {
                return res.status(400).json({ message: "Failed to upload media" });
            }
            imageOrVideoUrl = uploadFile.secure_url;

            if (file.mimetype.startsWith("image")) {
                contentType = "image";
            } else if (file.mimetype.startsWith("video")) {
                contentType = "video";
            } else {
                return res.status(400).json({ message: "Unsupported file type" });
            }
        } else if (content?.trim()) {
            contentType = "text";
        } else {
            return res.status(400).json({ message: "Message content is required" });
        }

        const message = new Message({
            conversation: conversation._id,
            sender: senderId,
            receiver: receiverId,
            content,
            contentType,
            imageOrVideoUrl,
            messageStatus: messageStatus || "sent",
        });

        await message.save();

        // Always set lastMessage
        conversation.lastMessage = message._id;
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture");

        // Emit event for real time
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(receiverId);
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("receive_message", populatedMessage);
                message.messageStatus = "delivered";
                await message.save();
            }
        }

        return res.status(201).json({
            message: "Message sent successfully",
            data: populatedMessage,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get all conversations
exports.getConversation = async (req, res) => {
    const userId = req.user.userId;
    try {
        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate("participants", "username profilePicture isOnline lastSeen")
            .populate({
                path: "lastMessage",
                populate: {
                    path: "sender receiver",
                    select: "username profilePicture",
                },
            })
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            message: "Conversations retrieved successfully",
            data: conversations,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get messages of a specific conversation
exports.getMessage = async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({ message: "Not authorized to view this conversation" });
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .sort("createdAt");

        // Mark messages as read
        await Message.updateMany(
            {
                conversation: conversationId,
                receiver: userId,
                messageStatus: { $in: ["sent", "delivered"] },
            },
            { $set: { messageStatus: "read" } }
        );

        // Reset unread count
        conversation.unreadCount = 0;
        await conversation.save();

        return res.status(200).json({
            message: "Messages retrieved",
            data: messages,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Mark specific messages as read
exports.markAsRead = async (req, res) => {
    const { messageIds } = req.body;
    const userId = req.user.userId;
    try {
        const messages = await Message.find({
            _id: { $in: messageIds },
            receiver: userId,
        });

        await Message.updateMany(
            { _id: { $in: messageIds }, receiver: userId },
            { $set: { messageStatus: "read" } }
        );

        // Notify original sender
        if (req.io && req.socketUserMap) {
            for (const message of messages) {
                const senderSocketId = req.socketUserMap.get(message.sender.toString());
                if (senderSocketId) {
                    req.io.to(senderSocketId).emit("message_read", {
                        _id: message._id,
                        messageStatus: "read",
                    });
                }
            }
        }

        return res.status(200).json({
            message: "Messages marked as read",
            data: messages,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.userId;
    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }
        if (message.sender.toString() !== userId) {
            return res.status(403).json({ message: "Not authorized to delete this message" });
        }

        await message.deleteOne();

        // Emit socket event
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(message.receiver.toString());
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("message_deleted", { _id: messageId });
            }
        }

        return res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};