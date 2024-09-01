const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,  // Ensure that emails are unique
    },
    password: {
      type: String,
      required: true,
      validate: (v) => v.length > 6,
    },
    resetToken: String,
    expireToken: Date,
  });
  

const User = mongoose.model("User", userSchema);

module.exports = User;
