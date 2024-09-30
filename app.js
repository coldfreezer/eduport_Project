const express = require('express');
const app = express();
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const path = require("path");
const session = require('express-session');
const customerRoutes = require('./routes/route'); // Ensure the correct path
// const morgan = require("morgan");

//payment gateway with razorpay
// const Razorpay = require('Razorpay')

// Load environment variables
require("dotenv/config");
console.log("customerRoutes" , customerRoutes);


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.your_secret_key,
    resave: false,
    saveUninitialized: true
}));

//mongodbconnection
// MongoDB cluster connection string
mongoose.connect(process.env.CONNECTION_STRING)
  .then(() => console.log('Connected to DB!'))
  .catch(error => console.error('Error connecting to DB:', error));

// Set up view engine and template path
app.set("view engine", "ejs");
const template_path = path.join(__dirname,"views");
app.set("views",template_path);

// Set up static paths for CSS/JS/image files
app.use(express.static(path.join(__dirname, "public")));
//set up statci path for uploads folder
app.use(express.static(path.join(__dirname, "uploads")));

// Morgan middleware
// app.use(morgan("tiny"));
//routes 
app.use('/', customerRoutes);


// var instance = new Razorpay({
//   key_id : 'rzp_test_du8jJUxQb7hup4',
//   key_secret : 'c6vt62PLaHCe3GeK793kRbLX'
// });

app.listen(process.env.ROUTE, () => {
    console.log('Server is running on port 3000',);
});