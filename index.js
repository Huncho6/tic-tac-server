const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoute = require("./routes/authRoute");
const db = require("./connect");

const { verifyToken, isUser } = require("./middleware/authMiddleware");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

db.on("error", (error) => console.log(error));
db.once("open", () => console.log("connected to database"));


app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.use("/", authRoute);
app.use("/", verifyToken, isUser, authRoute);
