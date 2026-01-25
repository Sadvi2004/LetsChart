const { otpGenerate } = require("../utils/otpGenerater");
const { sendOtpToEmail } = require("../service/emailService");
const twilioService = require("../service/twilioService");
const { response } = require("../utils/responseHandler");
const User = require("../models/User");
const { generateToken } = require("../utils/generateToken");
const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Conversation = require("../models/Conversation");

// Send OTP
const sendOtp = async (req, res) => {
    const { phoneNumber, phoneSuffix, email } = req.body;
    const otp = otpGenerate();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    try {
        if (email) {
            let user = await User.findOne({ email }) || new User({ email });
            user.emailOtp = otp;
            user.emailOtpExpiry = expiry;
            await user.save();
            await sendOtpToEmail(email, otp);
            return response(res, 200, "OTP sent to email", { email });
        }

        if (!phoneNumber || !phoneSuffix) {
            return response(res, 400, "Phone number and suffix are required");
        }

        // const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
        const fullPhoneNumber = phoneSuffix.startsWith("+")
            ? `${phoneSuffix}${phoneNumber}`
            : `+${phoneSuffix}${phoneNumber}`;

        let user = await User.findOne({ phoneNumber: fullPhoneNumber });
        if (!user) {
            user = new User({ phoneNumber: fullPhoneNumber, phoneSuffix });
            await user.save();
        }

        await twilioService.sendOtpToPhoneNumber(fullPhoneNumber);
        return response(res, 200, "OTP sent successfully");

    } catch (error) {
        console.error("sendOtp error:", error);
        return response(res, 500, "Internal Server Error");
    }
};

// Verify OTP
const verifyOtp = async (req, res) => {
    const { phoneNumber, phoneSuffix, otp, email } = req.body;

    try {
        let user;

        if (email) {
            user = await User.findOne({ email });
            if (!user) return response(res, 404, "User not found");

            if (
                !user.emailOtp ||
                String(user.emailOtp) !== String(otp) ||
                new Date() > new Date(user.emailOtpExpiry)
            ) {
                return response(res, 400, "Invalid or expired OTP");
            }

            user.isVerified = true;
            user.emailOtp = null;
            user.emailOtpExpiry = null;
            await user.save();
        } else {
            // const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
            const fullPhoneNumber = phoneSuffix.startsWith("+")
                ? `${phoneSuffix}${phoneNumber}`
                : `+${phoneSuffix}${phoneNumber}`;

            user = await User.findOne({ phoneNumber: fullPhoneNumber });
            if (!user) return response(res, 404, "User not found");

            const result = await twilioService.verifyOtp(fullPhoneNumber, otp);

            if (!result || result.status !== "approved") {
                return response(res, 400, "Invalid or expired OTP");
            }

            user.isVerified = true;
            await user.save();
        }

        const token = generateToken(user._id);

        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return response(res, 200, "OTP verified successfully", {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                phoneSuffix: user.phoneSuffix,
                profilePicture: user.profilePicture,
                isVerified: user.isVerified
            },
            token
        });

    } catch (error) {
        console.error("Error in verifyOtp:", error);
        return response(res, 500, "Internal Server Error");
    }
};

// Update Profile
const updateProfile = async (req, res) => {
    try {
        const { username, agreed, about, profilePicture } = req.body || {};
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Handle file upload
        if (req.file) {
            const uploadResult = await uploadFileToCloudinary(req.file);
            user.profilePicture = uploadResult?.secure_url;
        } else if (profilePicture) {
            user.profilePicture = profilePicture;
        }

        // Update fields
        if (username) user.username = username;

        if (agreed !== undefined) {
            if (typeof agreed === "string") {
                user.agreed = agreed.toLowerCase() === "true";
            } else {
                user.agreed = !!agreed;
            }
        }

        if (about) user.about = about;

        await user.save();
        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                agreed: user.agreed,
                phoneNumber: user.phoneNumber,
                phoneSuffix: user.phoneSuffix,
                profilePicture: user.profilePicture,
                about: user.about,
                isOnline: user.isOnline,
                lastSeen: user.lastSeen
            }
        });
    } catch (error) {
        console.error("Error in updateProfile:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Check Authenticated
const checkAuthenticated = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            return response(res, 404, "unauthorization please login");
        }
        const user = await User.findById(userId).select("username email phoneNumber phoneSuffix profilePicture isVerified");
        if (!user) {
            return response(res, 404, "user not found");
        }
        return response(res, 200, "user retrieved and allow to use application", user);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Logout
const logout = (req, res) => {
    try {
        res.cookie("auth_token", "", { expires: new Date(0) });
        return response(res, 200, "user logout successfully");
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Get All Users
const getAllUsers = async (req, res) => {
    const loggedInUser = req.user.userId;
    try {
        const users = await User.find({ _id: { $ne: loggedInUser } })
            .select("username profilePicture lastSeen isOnline about phoneNumber phoneSuffix email")
            .lean();

        const usersWithConversation = await Promise.all(
            users.map(async (user) => {
                const conversation = await Conversation.findOne({
                    participants: { $all: [loggedInUser, user?._id] }
                })
                    .populate({
                        path: "lastMessage",
                        select: "content createdAt sender receiver"
                    })
                    .lean();

                return {
                    ...user,
                    conversation: conversation || null
                };
            })
        );

        return response(res, 200, "user retrieved successfully", usersWithConversation);
    } catch (error) {
        console.error(error);
        return response(res, 500, "internal server error");
    }
};

module.exports = { sendOtp, verifyOtp, updateProfile, logout, checkAuthenticated, getAllUsers };