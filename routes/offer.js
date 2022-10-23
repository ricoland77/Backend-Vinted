const express = require("express"); // import package express
const router = express.Router(); // création du router express
const fileUpload = require("express-fileupload"); // Import du package express-fileupload, gère la récupérations de fichiers
router.use(express.urlencoded({ extended: true }));

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
    const image = req.files;
    const pictures = req.files;
    // console.log(image);

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

      // Image principale
      if (!image) {
        return res.status(400).json({ message: "Select image and upload" });
      }
      // transformer le buffer de mon img
      const convertToBase64 = (file) => {
        return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
      };
      //conversion de l'image reçu => en base64
      const imageConverted = convertToBase64(req.files.image);
      //   console.log(imageConverted);

      // envoye de l'image sur cloudinary dans un dossier Vinted
      const result = await cloudinary.uploader.upload(imageConverted, {
        folder: "/Vinted/offers/" + newOffer.owner._id,
      });
      // ajout de l'image dans l'annonce
      newOffer.product_image = result;

      // pictures secondaires
      const tab = [];
      for (let i = 0; i < pictures.length; i++) {
        if (pictures) {
          // transformer le buffer de mon img
          const convertToBase64 = (file) => {
            return `data:${file.mimetype};base64,${file.data.toString(
              "base64"
            )}`;
          };
          //conversion de l'image reçu => en base64
          const picturesConverted = convertToBase64(req.files.pictures);

          // envoye de l'image sur cloudinary dans un dossier Vinted
          const result = await cloudinary.uploader.upload(picturesConverted, {
            folder: "/Vinted/offers/" + newOffer.owner._id,
          });
        }
      }
      tab.push(result);
      // ajout de l'image dans l'annonce
      newOffer.product_pictures = result;

      // sauvegarder
      // await newOffer.save();

      res.status(200).json(newOffer);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// recherche dans les ANNONCES
router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    const filters = {};
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }

    if (priceMin) {
      filters.product_price = { $gte: Number(priceMin) };
    }

    // console.log(filters);
    if (priceMax) {
      if (!filters.product_price) {
        filters.product_price = { $lte: Number(priceMax) };
      } else {
        filters.product_price.$lte = Number(priceMax);
      }
    }
    // console.log(filters);

    const sortFilter = {};
    if (sort === "price-desc") {
      sortFilter.product_price = "desc";
    } else if (sort === "price-asc") {
      sortFilter.product_price = "asc";
    }

    // 5 resultats par page : 1 skip 0, 2 skip 5, 3 skip 10, 4 skip 15
    // 3 resultats par page : 1 skip 0, 2 skip 3, 3 skip 6, 4 skip 9
    const limit = 5;
    let pageRequired = 1;
    if (page) {
      pageRequired = Number(page);
    }

    const skip = (pageRequired - 1) * limit;

    const offers = await Offer.find(filters)
      .sort(sortFilter)
      .skip(skip)
      .limit(limit)
      // .select("product_name product_price owner")
      .populate("owner", "account _id");

    const offerCount = await Offer.countDocuments(filters);
    console.log(offerCount);

    res.json({ count: offerCount, offers: offers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    console.log(req.params);
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account _id"
    );
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
