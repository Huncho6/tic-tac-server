module.exports = (io) => {
  let rooms = {}; // Room management
  let connectedUsers = {}; // Track connected users
  let currentPlayer = "X"; // Start with X

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    connectedUsers[socket.id] = { id: socket.id, name: null, room: null };
    io.emit("update-users", connectedUsers);

    connectedUsers[socket.id].role = currentPlayer;
    socket.emit("playerRole", currentPlayer);
    currentPlayer = currentPlayer === "X" ? "O" : "X";

    socket.on("set-username", (name) => {
      connectedUsers[socket.id].name = name;
      io.emit("update-users", connectedUsers);
    });

    socket.on("invite-player", ({ to }) => {
      if (connectedUsers[to]) {
        io.to(to).emit("game-invitation", { from: socket.id });
      }
    });

    socket.on("accept-invitation", ({ to }) => {
      const roomId = `${socket.id}-${to}`;
      socket.join(roomId);

      const players = [socket.id, to];
      rooms[roomId] = {
        players,
        board: Array(9).fill(""),
        currentPlayer: "X",
      };

      io.to(to).emit("start-game", {
        roomId,
        opponent: socket.id,
        role: "O",
        currentPlayer: "X",
      });

      io.to(socket.id).emit("start-game", {
        roomId,
        opponent: to,
        role: "X",
        currentPlayer: "X",
      });

      console.log(`Game started in room ${roomId}`);
    });

    socket.on("make-move", ({ roomId, index, playerRole }) => {
      const room = rooms[roomId];
      if (!room) return;

      if (room.board[index] === "" && room.currentPlayer === playerRole) {
        room.board[index] = playerRole;
        room.currentPlayer = playerRole === "X" ? "O" : "X";

        io.to(roomId).emit("update-game", {
          board: room.board,
          currentPlayer: room.currentPlayer,
        });
      } else {
        socket.emit("invalid-move", { message: "Invalid move!" });
      }
    });

    socket.on("restartGame", ({ roomId }) => {
      const room = rooms[roomId];
      if (room) {
        room.board = Array(9).fill("");
        room.currentPlayer = "X";
        io.to(roomId).emit("update-game", {
          board: room.board,
          currentPlayer: room.currentPlayer,
        });
      }
    });

    socket.on("disconnect", () => {
      const user = connectedUsers[socket.id];
      if (user) {
        delete connectedUsers[socket.id];
        io.emit("update-users", connectedUsers);
      }

      for (const roomId in rooms) {
        const room = rooms[roomId];
        if (room.players.includes(socket.id)) {
          delete rooms[roomId];
          room.players.forEach((playerId) => {
            if (playerId !== socket.id) {
              io.to(playerId).emit("player-disconnected", {
                message: "Opponent left the game.",
              });
            }
          });
        }
      }
    });
  });
};
