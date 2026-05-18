const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpToEmail = async (email, otp) => {

    const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>🔐 Let'sChat Verification</h2>

      <p>Your OTP is:</p>

      <h1>${otp}</h1>

      <p>This OTP is valid for 5 minutes.</p>
    </div>
    `;

    const response = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Let'sChat OTP Verification",
        html,
    });

    console.log("Email sent:", response);
};

module.exports = { sendOtpToEmail };