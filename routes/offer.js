const express = require("express"); // import package express
const router = express.Router(); // création du router express
const fileUpload = require("express-fileupload"); // Import du package express-fileupload, gère la récupérations de fichiers

const User = require("../models/User"); // import de mon modèle User
const Offer = require("../models/Offer"); // import de mon modèle Offer
const userRoutes = require("../routes/user"); // import de ma route user
const isAuthenticated = require("../middlewares/isAuthenticated"); // Import du middleware isAuthenticated
const cloudinary = require("cloudinary").v2; // Import de cloudinary

// Fonction qui permet de transformer les fichiers qu'on reçoit sous forme de Buffer => en base64 afin de pouvoir les upload sur cloudinary
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// Création de ma route offer/publish
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    //   console.log("ok");
    const {
      title,
      description,
      price,
      condition,
      EMPLACEMENT,
      MARQUE,
      TAILLE,
      COULEUR,
    } = req.body; // destructuring
    const picture = req.files;
    // console.log(picture);

    try {
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: MARQUE },
          { TAILLE: TAILLE },
          { condition: condition },
          { COULEUR: COULEUR },
          { EMPLACEMENT: EMPLACEMENT },
        ],
        owner: req.user,
      });

      // transformer le buffer de mon img
      const convertToBase64 = (file) => {
        return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
      };
      //conversion de l'image reçu => en base64
      const pictureConverted = convertToBase64(req.files.picture);
      //   console.log(pictureConverted);

      // envoye de l'image sur cloudinary dans un dossier Vinted
      //   if (req.files?.picture) {
      // }
      const result = await cloudinary.uploader.upload(pictureConverted, {
        folder: "/Vinted/offers/" + newOffer.owner._id,
      });
      // ajout de l'image dans l'annonce
      newOffer.product_image = result;

      // sauvegarder
      await newOffer.save();
      res.status(200).json(newOffer);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// recherche dans les ANNONCES
router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page, skip } = req.query;

    const filters = {};
    const regExp = new RegExp(req.query.title, "i");
    // console.log(filters);

    if (title) {
      filters.product_name = regExp;
    }

    if (priceMin) {
      filters.product_price = {
        $gte: req.query.priceMin,
      };
    }

    if (priceMax) {
      filters.product_price = {
        $lte: req.query.priceMax,
      };
    }
    // !!! WARNING !!! => filtre sort ne fonctionne pas !!!

    // let sortValue = 0;
    // if (sort === "price-desc") {
    //   sortValue = -1;
    // }
    // if (sort === "price-asc") {
    //   sortValue = 1;
    // }

    // if (sort) {
    //   filters.sort = req.query.sort;
    // }

    if (sort) {
      filters.product_price = req.query.sort;
    }

    if (page) {
      filters.page = req.query.page;
    }

    if (skip) {
      filters.skip = req.query.skip;
    }

    const result = await Offer.find(filters)
      // .sort(req.query.sort)
      .limit(req.query.page)
      .skip(req.query.skip)
      .select("product_name product_price");

    console.log(result);

    /*
    const result = await Offer.find({
      // product_name: regExp,
      product_price: { $gte: req.query.priceMin, $lte: req.query.priceMax },
    })
      .sort({ product_price: req.query.sort })
      .skip(req.query.skip)
      .limit(req.query.page)
      .select("product_price product_name product_details product_image");*/
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route OFFER => récupère les détails d'une annonce, en fonction de son id
router.get("/offer/:id", async (req, res) => {
  try {
    const detailOffer = await Offer.findById(req.params.id)
      .populate("owner", "account _id")
      .select("-product_name -_id -product_description");
    // console.log(detailOffer);
    res.status(200).json(detailOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
