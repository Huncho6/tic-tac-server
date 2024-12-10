const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming a "User" schema exists for registered users
      required: true,
    },
  ],
  roomId: {
    type: String,
    required: true,
  },
  board: {
    type: [String], // Representing the 3x3 board as a flat array of 9 elements
    default: Array(9).fill(""),
  },
  moves: [
    {
      player: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      position: Number, // Board index (0-8)
    },
  ],
  currentPlayer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Null if the game is ongoing or ends in a draw
  },
  isDraw: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Game", gameSchema);
