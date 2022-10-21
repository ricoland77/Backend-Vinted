const express = require("express"); // import du package express
const fileUpload = require("express-fileupload"); // Import de cloudinary
const User = require("../models/User"); // import de mon modèle User
const Offer = require("../models/Offer"); // import de mon modèle Offer

//
const isAuthenticated = async (req, res, next) => {
  try {
    // recherche de mon token et suppression de "Bearer "
    const token = req.headers.authorization.replace("Bearer ", "");
    // console.log(token);

    // recherche d'un user dont le token est celui qu'on a reçu
    const user = await User.findOne({ token: token }).select("account");
    // console.log(user);

    // si je ne trouve pas de user
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Si je trouve un user correspondant au token reçu, je le stocke dans req.user pour pouvoir le réutiliser dans ma route
    req.user = user;

    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
