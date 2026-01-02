const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authToken = req.cookies?.auth_token;
    if (!authToken) return res.status(401).json({ error: "Auth token missing" });

    try {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

module.exports = { authMiddleware };