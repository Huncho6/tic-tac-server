const User = require("../models/userModel");
const nodemailer = require("nodemailer"); //importing nodemailer to get email when account is created
const crypto = require("crypto"); //crypto is a random token generator that help to generate otp for for the forget password function
const bcrypt = require("bcrypt"); //importing bcrypt after installation
const jwt = require("jsonwebtoken"); //importing jsonwebtoken
const dotenv = require("dotenv"); //importing dotenv
dotenv.config();

exports.createAccount = async (req, res) => {
  try {
    const { account } = req.params;
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    if (account === "user") {
      const isUserExist = await User.findOne({ email });
      if (isUserExist) {
        return res.status(400).send({
          status: "error",
          message: "User already exists",
        });
      }

      // Create the user and save to the database
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
      });

      await newUser.save(); // Save the user to the database

      // Send confirmation email
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "abodunrinb403@gmail.com", // Your email here
          pass: process.env.GOOGLE_APP_PASSWORD, // Your Google App Password
        },
      });

      const mailOptions = {
        from: "abodunrinb403@gmail.com", // Your email here
        to: email,
        subject: "Huncho's Tic-tac-toe",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #4CAF50;">Congratulations ${username}!</h2>
              <p>Your account has been created successfully.</p>
              <p>If you did not request this email, please ignore it.</p>
              <p>Thank you,<br>The Team</p>
            </div>
          `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res
            .status(500)
            .json({ message: "Error sending email", error });
        } else {
          return res.status(201).json({
            status: "success",
            message:
              "Account created successfully. Please check your email for the confirmation code.",
          });
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//function to login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body; // Destructuring username and password
    const { account } = req.params;

    if (!password || !username) {
      // Check if both username and password are provided
      return res
        .status(400)
        .json({ message: "Please provide a username and password" });
    }

    if (account === "user") {
      // Find user by username
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" }); // Username not found
      }

      // Check if password is correct
      const isCorrectPassword = await bcrypt.compare(password, user.password);
      if (!isCorrectPassword) {
        return res.status(401).json({ message: "Invalid credentials" }); // Incorrect password
      }

      // Generate JWT token if credentials are valid
      const token = jwt.sign(
        {
          id: user._id,
          role: "user",
        },
        process.env.SECRET_KEY, // Secret key from dotenv file
        { expiresIn: "1h" } // Token expiration time
      );

      // Respond with success message and token
      res.status(200).json({
        status: "success",
        data: {
          token,
          userInfo: {
            _id: user._id,
            username: user.username, // Use `username` instead of `name`
            email: user.email,
          },
        },
        message: "User logged in successfully",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.userForgotPassword = async ({ body: { email } }, res) => {
  // Check if the email exists in the database
  const user = await User.findOne({ email });
  if (!user)
    return res
      .status(404)
      .json({ message: "Email does not exist", status: "error" });

  // Generate a random token (OTP) to reset the password
  const generatedToken = crypto.randomBytes(3);
  if (!generatedToken) {
    return res.status(500).json({
      message: "An error occurred. Please try again later.",
      status: "error",
    });
  }

  // Convert the token into a hex string
  const convertTokenToHexString = generatedToken.toString("hex");

  // Assign the converted string to the resetToken and set the expiration period
  user.resetToken = convertTokenToHexString;
  user.expireToken = Date.now() + 1800000; // Token expires in 30 minutes

  try {
    // Save the token and expiration period to the user's record
    const saveToken = await user.save();

    // Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "abodunrinb403@gmail.com", // Replace with your actual email
        pass: process.env.GOOGLE_APP_PASSWORD, // Use environment variable for password
      },
    });

    // Set up mail options
    const mailOptions = {
      from: "abodunrinb403@gmail.com",
      to: user.email,
      subject: "Password Reset Request",
      text: `This is your password reset token: ${convertTokenToHexString}.`,
    };

    // Send the email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(500).json({
          status: false,
          message: `Error sending email -> ${error}`,
        });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({
          message: "Password reset token has been sent to your email.",
          data: {
            resetToken: saveToken.resetToken, // Send the token to the user
            expireToken: saveToken.expireToken,
          },
          status: "success",
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Error trying to save token -> ${error.message}`,
    });
  }
};

exports.userResetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body; // These parameters are required to change the password

  // Find the user with the provided reset token and check if the token has not expired
  const user = await User.findOne({
    resetToken,
    expireToken: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;

  // Remove the resetToken and expireToken fields from the database
  user.resetToken = undefined;
  user.expireToken = undefined;

  await user.save();

  try {
    // Save the updated user data
    await user.save();
    res.status(200).json({
      status: "success",
      message: "Password has been reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `Error resetting password -> ${error.message}`,
    });
  }
};
