const express = require('express');
const router = express.Router();
const controller = require('../contollers/controller');
const multer = require("multer")
const path = require("path");
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;


//multer module for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extname = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extname);
  },
});

const upload = multer({ storage: storage });

//middleware for authentication
function isAuthenticated(req, res, next) {
  const token = req.session.token;
  if (!token) {
      return res.redirect("sign-in");
  }

  try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Attach the decoded token to the request object
      return next();
  } catch (error) {
      console.log("JWT verification failed:", error);
      return res.redirect("sign-in");
  }
}

//transaction datatable route
router.get('/transaction-page',isAuthenticated,controller.transaction)

//cart test routes 
router.get('/cart',isAuthenticated,controller.cartload)
// Fetch cart items for logged-in user
router.get('/cart-items', controller.cart_items)
// Save cart items for logged-in user
router.post('/save-cart', controller.save_cart)

// test login route 
router.get("/", controller.slash)

// auth routes
router.get('/sign-in',controller.signin)
router.get('/sign-up',controller.signup)
router.get('/sign-out',isAuthenticated,controller.signout)
router.get('/edit-profile',isAuthenticated,controller.edit)

//category routes====================================
router.get('/add-category',controller.addCategory)
router.post('/add-category',upload.single('image'),controller.add_category)

//sub-category-routes===============================
router.get('/sub-category-page',controller.sub_category)

//products routes===================================
// router.get('/view-product',isAuthenticated,controller.view_product)
router.get('/product-page',controller.product_page)
router.get('/add-product',controller.add_product)
router.get('/product-description',controller.product_description)
//product post routes
router.post('/add-product',isAuthenticated,controller.addproduct)

// post routes
router.post('/sign-in',controller.signinn)
router.post('/sign-up',controller.signupp)
// router.post('/edit-profile',isAuthenticated,controller.editt)

//checkout routes===========================
router.get('/checkout',isAuthenticated,controller.checkout)
//payment gateway apis
router.post('/createOrder',isAuthenticated,controller.createOrder)

module.exports = router;
