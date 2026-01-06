const { Server } = require('socket.io');
const User = require('../models/User');
const Message = require('../models/Message');

// Maps to track online presence and typing states
const onlineUsers = new Map();
const typingUsers = new Map();

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        },
        pingTimeout: 60000, // disconnect inactive sockets after 60s
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        let userId = null;

        // User connected
        socket.on('user_connected', async (connectingUserId) => {
            try {
                userId = connectingUserId;
                onlineUsers.set(userId, socket.id);
                socket.join(userId); // join personal room

                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    lastSeen: new Date(),
                });

                io.emit('user_status', { userId, isOnline: true });
            } catch (error) {
                console.log('Error handling user connection', error);
            }
        });

        // Query a specific user's online status
        socket.on('get_user_status', (requestedUserId, callback) => {
            const isOnline = onlineUsers.has(requestedUserId);
            callback({
                userId: requestedUserId,
                isOnline,
                lastSeen: isOnline ? new Date() : null,
            });
        });

        // Relay a message to receiver if online
        socket.on('send_message', async (message) => {
            try {
                // Prefer receiverId if provided, otherwise attempt receiver._id
                const receiverId =
                    message.receiverId ||
                    (message.receiver && message.receiver._id && message.receiver._id.toString());

                if (!receiverId) {
                    socket.emit('message_error', { error: 'Invalid receiver' });
                    return;
                }

                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive_message', message);
                }
            } catch (error) {
                console.error('Error sending message', error);
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        // Mark messages as read and notify sender(s)
        socket.on('message_read', async ({ messageIds, senderId }) => {
            try {
                if (!Array.isArray(messageIds) || messageIds.length === 0) return;

                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { messageStatus: 'read' } }
                );

                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit('message_status_update', {
                        messageIds,
                        messageStatus: 'read',
                    });
                }
            } catch (error) {
                console.log('Error updating message read status', error);
            }
        });

        // Typing start with auto-timeout
        socket.on('typing_start', ({ conversationId, receiverId }) => {
            if (!userId || !conversationId || !receiverId) return;

            if (!typingUsers.has(userId)) typingUsers.set(userId, {});
            const userTyping = typingUsers.get(userId);

            userTyping[conversationId] = true;

            if (userTyping[`${conversationId}_timeout`]) {
                clearTimeout(userTyping[`${conversationId}_timeout`]);
            }

            userTyping[`${conversationId}_timeout`] = setTimeout(() => {
                userTyping[conversationId] = false;
                io.to(receiverId).emit('user_typing', {
                    userId,
                    conversationId,
                    isTyping: false,
                });
            }, 3000);

            io.to(receiverId).emit('user_typing', {
                userId,
                conversationId,
                isTyping: true,
            });
        });

        // Typing stop
        socket.on('typing_stop', ({ conversationId, receiverId }) => {
            if (!userId || !conversationId || !receiverId) return;

            if (typingUsers.has(userId)) {
                const userTyping = typingUsers.get(userId);

                if (userTyping[`${conversationId}_timeout`]) {
                    clearTimeout(userTyping[`${conversationId}_timeout`]);
                    delete userTyping[`${conversationId}_timeout`];
                }

                userTyping[conversationId] = false;
            }

            io.to(receiverId).emit('user_typing', {
                userId,
                conversationId,
                isTyping: false,
            });
        });

        // Add or toggle reaction on a message
        socket.on('add_reaction', async ({ messageId, emoji, reactionUserId }) => {
            try {
                if (!messageId || !emoji || !reactionUserId) return;

                const message = await Message.findById(messageId);
                if (!message) return;

                const existingIndex = message.reactions.findIndex(
                    (r) => r.user.toString() === reactionUserId
                );

                if (existingIndex > -1) {
                    const existing = message.reactions[existingIndex];
                    if (existing.emoji === emoji) {
                        // Same emoji -> remove reaction (toggle off)
                        message.reactions.splice(existingIndex, 1);
                    } else {
                        // Different emoji -> update reaction
                        message.reactions[existingIndex].emoji = emoji;
                    }
                } else {
                    message.reactions.push({ user: reactionUserId, emoji });
                }

                await message.save();

                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'username profilePicture')
                    .populate('receiver', 'username profilePicture')
                    .populate('reactions.user', 'username');

                const reactionUpdated = {
                    messageId,
                    reactions: populatedMessage.reactions,
                };

                const senderId =
                    populatedMessage.sender && populatedMessage.sender._id
                        ? populatedMessage.sender._id.toString()
                        : null;
                const receiverId =
                    populatedMessage.receiver && populatedMessage.receiver._id
                        ? populatedMessage.receiver._id.toString()
                        : null;

                const senderSocket = senderId ? onlineUsers.get(senderId) : null;
                const receiverSocket = receiverId ? onlineUsers.get(receiverId) : null;

                if (senderSocket) io.to(senderSocket).emit('reaction_update', reactionUpdated);
                if (receiverSocket) io.to(receiverSocket).emit('reaction_update', reactionUpdated);
            } catch (error) {
                console.log('Error handling reaction', error);
            }
        });

        // Clean up on disconnect
        const handleDisconnected = async () => {
            if (!userId) return;
            try {
                onlineUsers.delete(userId);

                if (typingUsers.has(userId)) {
                    const userTyping = typingUsers.get(userId);
                    Object.keys(userTyping).forEach((key) => {
                        if (key.endsWith('_timeout')) clearTimeout(userTyping[key]);
                    });
                    typingUsers.delete(userId);
                }

                await User.findByIdAndUpdate(userId, {
                    isOnline: false,
                    lastSeen: new Date(),
                });

                io.emit('user_status', {
                    userId,
                    isOnline: false,
                    lastSeen: new Date(),
                });

                socket.leave(userId);
                console.log(`User ${userId} disconnected`);
            } catch (error) {
                console.log('Error handling disconnection', error);
            }
        };

        socket.on('disconnect', handleDisconnected);
    });

    // expose map for HTTP handlers to use
    io.socketUserMap = onlineUsers;
    return io;
};

module.exports = initializeSocket;