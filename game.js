const games = {}; // Store game state for multiple game sessions

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle player joining a room
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);

      if (!games[roomId]) {
        games[roomId] = {
          board: Array(9).fill(""),
          currentPlayer: 'X',
          players: [socket.id],
        };
      } else {
        games[roomId].players.push(socket.id);
      }

      // Notify all players in the room about the game state
      io.to(roomId).emit('update-game', games[roomId]);
    });

    // Handle a move made by a player
    socket.on('make-move', (data) => {
      const { roomId, index } = data;
      const game = games[roomId];

      if (game && game.board[index] === "" && game.players.includes(socket.id)) {
        // Update board and toggle turn
        game.board[index] = game.currentPlayer;
        game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';

        // Emit the updated game state to all players in the room
        io.to(roomId).emit('update-game', game);
      }
    });

    // Handle game restart
    socket.on('restart-game', (roomId) => {
      if (games[roomId]) {
        games[roomId].board = Array(9).fill("");
        games[roomId].currentPlayer = 'X';
        io.to(roomId).emit('update-game', games[roomId]);
      }
    });

    // Handle player disconnect
    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);

      // Find the room the player was in
      for (const roomId in games) {
        if (games[roomId].players.includes(socket.id)) {
          // Remove player from the game session
          games[roomId].players = games[roomId].players.filter(id => id !== socket.id);

          // If no players left, delete the game session
          if (games[roomId].players.length === 0) {
            delete games[roomId];
          } else {
            // Notify remaining players about the disconnection
            io.to(roomId).emit('player-disconnected', { playerId: socket.id });
          }
          break;
        }
      }
    });
  });
};
