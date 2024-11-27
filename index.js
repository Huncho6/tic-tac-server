const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

const rooms = {};
const users = {};

// Socket.io Setup
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("set-username", (username) => {
    users[socket.id] = { id: socket.id, name: username };
    io.emit("update-users", users);
  });

  socket.on("invite-player", ({ to }) => {
    if (users[to]) {
      io.to(to).emit("game-invitation", { from: socket.id, name: users[socket.id]?.name });
    }
  });

  socket.on("accept-invitation", ({ to }) => {
    const roomId = `${socket.id}-${to}`;
    socket.join(roomId);
    io.to(to).emit("start-game", { roomId, opponent: socket.id, role: "O" });
    io.to(socket.id).emit("start-game", { roomId, opponent: to, role: "X" });
    rooms[roomId] = { board: Array(9).fill(null), currentPlayer: "X" };
  });

  socket.on("make-move", ({ roomId, index, playerRole }) => {
    const room = rooms[roomId];
    if (room && room.board[index] === null && room.currentPlayer === playerRole) {
      room.board[index] = playerRole;
      room.currentPlayer = playerRole === "X" ? "O" : "X";
      io.to(roomId).emit("update-game", { board: room.board, currentPlayer: room.currentPlayer });
    } else {
      socket.emit("invalid-move", { message: "Invalid move" });
    }
  });

  socket.on("restartGame", ({ roomId }) => {
    const room = rooms[roomId];
    if (room) {
      room.board = Array(9).fill(null);
      room.currentPlayer = "X";
      io.to(roomId).emit("update-game", { board: room.board, currentPlayer: room.currentPlayer });
    }
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("update-users", users);
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 45;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
