const { Router } = require("express");

const { createAccount, login, userForgotPassword , userResetPassword } = require("../controllers/authcontroller");
const router = Router();

router.post("/auth/create-account/:account", createAccount); // Create account function
router.post("/auth/login/:account", login); // Login function
router.post("/auth/forgot-password/:account", userForgotPassword);
router.post("/auth/reset-password/:account", userResetPassword);
module.exports = router;
