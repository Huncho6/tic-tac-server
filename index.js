const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoute = require("./routes/authRoute");
const db = require("./connect");

const { verifyToken, isUser } = require("./middleware/authMiddleware");
const http = require("http");
const socketIo = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = socketIo(server); // Initialize Socket.io

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173"); // Your frontend's origin
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Database connection
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("connected to database"));

// Socket.io Setup
require("./game")(io); // Pass io instance to game.js

// Routes
app.use("/", authRoute);
app.use("/", verifyToken, isUser, authRoute);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
