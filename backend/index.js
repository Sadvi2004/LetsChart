const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const http = require("http");

const connectDB = require("./config/dbConnect");
const initializeSocket = require("./service/socketService");

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoute");
const statusRoutes = require("./routes/statusRoute");

dotenv.config();

const app = express();

// ===============================
// DATABASE
// ===============================
connectDB();

// ===============================
// CORS
// ===============================
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

// ===============================
// MIDDLEWARE
// ===============================
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// ===============================
// CREATE SERVER + SOCKET
// ===============================
const server = http.createServer(app);
const io = initializeSocket(server);

// 🔥 IMPORTANT: socket middleware BEFORE routes
app.use((req, res, next) => {
    req.io = io;
    req.socketUserMap = io.socketUserMap;
    next();
});

// ===============================
// ROUTES
// ===============================
app.get("/", (req, res) => {
    res.send("Hello from Let's Chat Backend");
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/status", statusRoutes);

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});