const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, content } = req.body;
        const file = req.file;

        const participants = [senderId, receiverId].sort();

        let conversation = await Conversation.findOne({
            participants: { $all: participants, $size: 2 },
        });

        if (!conversation) {
            conversation = new Conversation({ participants });
            await conversation.save();
        }

        let contentType = "text";
        let imageOrVideoUrl = null;

        if (file) {
            const upload = await uploadFileToCloudinary(file);
            imageOrVideoUrl = upload.secure_url;
            contentType = file.mimetype.startsWith("image") ? "image" : "video";
        }

        const message = new Message({
            conversation: conversation._id,
            sender: senderId,
            receiver: receiverId,
            content,
            contentType,
            imageOrVideoUrl,
            messageStatus: "sent",
        });

        await message.save();

        conversation.lastMessage = message._id;

        // ✅ increment unread count ONLY for receiver
        if (senderId.toString() !== receiverId.toString()) {
            conversation.unreadCount += 1;
        }

        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture");

        // ✅ EMIT LIVE MESSAGE TO RECEIVER
        if (req.io && req.socketUserMap) {
            const receiverSocketId = req.socketUserMap.get(receiverId.toString());
            if (receiverSocketId) {
                req.io.to(receiverSocketId).emit("receive_message", populatedMessage);
            }
        }

        return res.status(201).json({
            message: "Message sent",
            data: populatedMessage,
        });

    } catch (err) {
        console.error(err);
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
            .populate("participants", "username profilePicture")
            .populate({
                path: "lastMessage",
                select: "content createdAt sender receiver",
                populate: {
                    path: "sender receiver",
                    select: "username profilePicture",
                },
            })
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            message: "Conversations fetched",
            data: conversations,
        });

    } catch (err) {
        console.error(err);
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
            return res.status(403).json({ message: "Unauthorized" });
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate("sender", "username profilePicture")
            .populate("receiver", "username profilePicture")
            .sort("createdAt");

        // mark messages as read
        await Message.updateMany(
            {
                conversation: conversationId,
                receiver: userId,
                messageStatus: { $in: ["sent", "delivered"] },
            },
            { $set: { messageStatus: "read" } }
        );

        // ✅ reset unread count
        conversation.unreadCount = 0;
        await conversation.save();

        return res.status(200).json({
            message: "Messages fetched",
            data: messages,
        });

    } catch (err) {
        console.error(err);
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