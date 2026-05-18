const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },

    tls: {
        rejectUnauthorized: false,
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.error("Error with email services:", error.message);
    } else {
        console.log("Email service is ready to send messages");
    }
});

const sendOtpToEmail = async (email, otp) => {

    const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>🔐 Let'sChat Verification</h2>

      <p>Your OTP is:</p>

      <h1>${otp}</h1>

      <p>This OTP is valid for 5 minutes.</p>
    </div>
    `;

    await transporter.sendMail({
        from: `Let'sChat <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Let'sChat OTP Verification",
        html,
    });
};

module.exports = { sendOtpToEmail };