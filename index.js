const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload"); // Import de cloudinary
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// import de la route user(signup/login) et offer(publish)
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");

app.use(userRoutes);
app.use(offerRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to my project hello 🚀🚀🚀🚀🚀🚀" });
});

app.all("*", (req, res) => {
  res.status(400).json({ message: "Cannot find this URL..." });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is started`);
});
