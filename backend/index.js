const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/dbConnect');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require("./routes/chatRoute");

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));


//routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);


// Database connection
connectDB();

app.get('/', (req, res) => {
    res.send("Hello from Let's Chat Backend");
})

const Port = process.env.PORT || 5000;
app.listen(Port, () => {
    console.log(`Server is running on port ${Port}`);
})