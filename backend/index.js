const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/dbConnect');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require("./routes/chatRoute");
const http = require('http');
const initializeSocket = require('./service/socketService');
const statusRoutes = require("./routes/statusRoute");

dotenv.config();
const app = express();

// Database connection
connectDB();

//Main Message
app.get('/', (req, res) => {
    res.send("Hello from Let's Chat Backend");
})

//routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/status', statusRoutes);

const corsOption = {
    origin: process.env.FRONTEND_URL,
    credentials: true
}
app.use(cors(corsOption))

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

//create server
const server = http.createServer(app)
const io = initializeSocket(server)

//apply socket middleware before routes
app.use((req, res, next) => {
    req.io = io;
    req.socketUserMap = io.socketUserMap
    next();
})

const Port = process.env.PORT || 5000;
server.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
})