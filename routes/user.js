const express = require("express"); // import du package express
const router = express.Router(); // création d'une variable pour la fonction Router de express
const uid2 = require("uid2"); // import du package uid2 qui émule des string aléatoires
const SHA256 = require("crypto-js/sha256"); // import du package SHA256 qui sert à encrypter une string
const encBase64 = require("crypto-js/enc-base64"); // import du package encBase64 qui sert à transformer l'encryptage en string
const fileUpload = require("express-fileupload"); // Import de cloudinary
const isAuthenticated = require("../middlewares/isAuthenticated"); // Import du middleware isAuthenticated

const User = require("../models/User"); // import de mon modèle User
const Offer = require("../models/Offer"); // import de mon modèle Offer

// route pour s'inscrire sur le site Vinted
router.post("/user/signup", async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.body; // destructuring d'objet, création des variables username, etc.
    if (!username) {
      return res.status(400).json({ message: "Username is not filled in" });
    }

    const user = await User.findOne({ email: email }); // recherche d'un user par email

    // si user existe déjà, je return le message
    if (user) {
      return res.status(400).json({ message: "User all ready exist" });
    }

    const salt = uid2(16); // générer un salt
    const hash = SHA256(salt + password).toString(encBase64); // générer un hash
    const token = uid2(64); // générer un token

    // création d'un nouveau user
    const newUser = new User({
      email: email,
      account: {
        username: username,
      },
      newsletter: newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });
    await newUser.save(); // sauvegarde de newUser dans la BDD
    res
      .status(200)
      .json({ message: "Your account has been created", token: newUser.token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route pour se connecter
router.post("/user/login", async (req, res) => {
  const { email, password } = req.body; // destructuring d'objet, création des variables username, etc.

  const user = await User.findOne({ email: email }); // recherche par email pour vérifier que le user soit bien déjà inscrit

  // si le user n'existe pas
  if (!user) {
    return res.status(200).json({ message: "You are NOT allowed to log in" });
  }

  const newHash = SHA256(user.salt + password).toString(encBase64);

  if (newHash === user.hash) {
    res.status(200).json({
      _id: user._id,
      token: user.token,
      account: {
        username: user.account.username,
      },
    });
  } else {
    res.status(400).json({ message: "Unauthorized" });
  }
});

module.exports = router;
