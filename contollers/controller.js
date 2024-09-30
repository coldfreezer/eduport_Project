const adminData = require('../model/admin_model');
const productData = require('../model/cart_model')
const categoryData = require('../model/category_model')
const cart = require('../model/cart_model')
const customer_orders = require('../model/order_model')
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config(); // Load environment variables

const JWT_SECRET = process.env.JWT_SECRET;


function generateTransactionId() {
  return uuidv4();
}

// const transactionId = generateTransactionId();
// console.log(transactionId);

//configuration for uuid
require("dotenv/config");

const { razor_key_secret, razor_key_id } = process.env;

// razorpay instance
const razorpayInstance = new Razorpay({
    key_id: razor_key_id,
    key_secret: razor_key_secret
});
//create order 
exports.createOrder = async (req, res) => {
    try {
        const amount = req.body.amount * 100
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: 'vikasbisht.img@gmail.com'
        }

        razorpayInstance.orders.create(options,
            (err, order) => {
                if (!err) {
                    let data = {
                        success: true,
                        msg: 'Order Created',
                        order_id: order.id,
                        status: "Pending",
                        amount: amount,
                        key_id: razor_key_id,
                        product_name: req.body.name,
                        customerId: req.body.customerId,
                        productId: req.body.productId,
                        description: req.body.description,
                        email: req.body.email
                    }
                       
                    let customer_order = new customer_orders({
                        productId: data.productId,
                        order_id: data.order_id,
                        amount: data.amount / 100,
                        customerId: data.customerId,
                        transaction_Id: generateTransactionId(),
                        email: data.email,
                        status: data.status
                    })
                    console.log("customer_order", customer_order)

                    customer_order.save();

                    res.status(200).send(data);
                }
                else {
                    console.log(err)
                    res.status(400).send({ success: false, msg: 'Something went wrong!' });
                }
            }
        );


    } catch (error) {
        console.log(error.message);
    }
}

exports.transaction = async (req, res) => {
    try {
        let customer = await adminData.findOne({ email: req.session.email });
        let user = req.session.email;
        let categories = await categoryData.find({ category: null });
        let cartItems = [];

        const page = parseInt(req.query.page) || 1;
        const pageSize = 5; // Define the number of items per page

        if (user) {
            cartItems = await cart.find({ userId: customer._id });
        }

        const totalItems = await customer_orders.countDocuments({ customerId: customer._id });

        const customer_transaction = await customer_orders.find({ customerId: customer._id })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 }); // Sort by date

        const totalPages = Math.ceil(totalItems / pageSize);

        res.render('transaction-page', { user, categories, cartItems, customer_transaction, page, totalPages });
    } catch (error) {
        console.error('Error loading transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


exports.slash = async (req, res) => {
    let categories = await categoryData.find({ category: null });
    let user = req.session.email;
    let cartItems = [];

    if (user) {
        let customer = await adminData.findOne({ email: user });
        if (customer) {
            cartItems = await cart.find({ userId: customer._id });
        }
    }
    res.render('index', { categories, user, cartItems });
};

//cart  controllers========================
exports.cart_items = async (req, res) => {
    if (req.session.email) {
        try {
            let customer = await adminData.findOne({ email: req.session.email });
            if (customer) {
                let cartItems = await cart.find({ userId: customer._id });
                res.json({ cartItems });
            } else {
                res.json({ cartItems: [] });
            }
        } catch (error) {
            console.error('Error fetching cart items:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.json({ cartItems: [] });
    }
}

//working code
exports.cartload = async (req, res) => {
    try {
        let customer = await adminData.findOne({ email: req.session.email });
        let user = req.session.email;
        let categories = await categoryData.find({ category: null });
        let cartItems = [];

        if (user) {
            // Fetch cart items and join with categoryData to include image field
            cartItems = await cart.aggregate([
                { $match: { userId: customer._id } },
                {
                    $lookup: {
                        from: 'categorycollections', // Make sure this matches the actual collection name
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'image'
                    }
                },
                { $unwind: '$image' },
                {
                    $project: {
                        productId: 1,
                        name: 1,
                        quantity: 1,
                        totalPrice: 1,
                        'image.image': 1
                         // Include other fields if needed
                    }
                }
            ]);
        }

        console.log("Cart Items with Product Details: ", cartItems);

        res.render('cart', { categories, user, cartItems });
    } catch (error) {
        console.error('Error loading cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


//working code 
exports.save_cart = async (req, res) => {
    if (req.session.email) {
        try {
            let customer = await adminData.findOne({ email: req.session.email });
            if (customer) {
                const { cartItems, removedItems } = req.body;

                console.log("cart Items++++++", cartItems);
                console.log("removed Items++++++", removedItems);

                // Iterate over each cart item and update or add to the database
                for (let item of cartItems) {
                    await cart.updateOne(
                        { userId: customer._id, productId: item.id },
                        { $set: { name: item.name, quantity: item.quantity, totalPrice: item.totalPrice } },
                        { upsert: true }
                    );
                }

                // Iterate over each removed item and delete from the database
                for (let itemId of removedItems) {
                    await cart.deleteOne({ userId: customer._id, productId: itemId });
                }

                res.json({ message: 'Cart saved successfully' });
            } else {
                res.status(400).json({ error: 'User not found' });
            }
        } catch (error) {
            console.error('Error saving cart items:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
}

exports.product_page = async (req, res) => {
    try {
        let subcategoryId = req.query.subcategoryId;
        let user = req.session.email
        let cartItems = [];
        if (req.session.userId) {
            cartItems = await cart.find({ userId: req.session.userId });
        }
        let product = await categoryData.find({ category: subcategoryId });
        let categories = await categoryData.find({ category: null })
        res.render("product-page", { product, categories, user, cartItems });
    } catch (err) {
        console.error("Error fetching product:", err);
        res.status(500).send("Internal Server Error");
    }
};

exports.product_description = async (req, res) => {
    let user = req.session.email
    let productId = req.query.productId
    let categories = await categoryData.find({ category: null })

    let cartItems = [];
    if (req.session.userId) {
        cartItems = await cart.find({ userId: req.session.userId });
    }

    let product = await categoryData.findOne({ _id: productId })
    res.render('product-description', { product, categories, user, cartItems })
}

exports.add_product = async (req, res) => {
    let categoryId = req.query
    console.log("categoryID+++++++++++++++", categoryId)
    res.render('add-product', categoryId)
}


exports.addproduct = async (req, res) => {
    let { name, slug, price, categoryId } = req.body;
    console.log(req.body, "+++++++++++++++++++++++");

    // Check if product already exists
    let existingProduct = await productData.findOne({ name: name });

    if (existingProduct) {
        // Product already exists
        return res.status(400).json({ message: 'Product already exists' });
    } else {
        // Create and save the new product
        let products = new productData({
            name: name,
            slug: slug,
            price: price,
            category: categoryId
        });

        await products.save();

        return res.status(200).json({ message: 'Product added successfully' });
    }
};


exports.signin = async (req, res) => {
    res.render('sign-in')
}

exports.signup = async (req, res) => {
    console.log("=++++++++++++")

    res.render('sign-up')
}


//test code
exports.signinn = async (req, res) => {
    try {
        let { email, password, cartItems } = req.body;

        // Find user by email
        let user = await adminData.findOne({ email: email });

        // If user is not found
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
           
            const payload = { id: user._id, email: user.email };
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
             
            // Store JWT in session
            req.session.token = token;
            req.session.email = user.email;
            user.logged_in = true;

            // Transfer cart items from local storage to the database
            if (cartItems && cartItems.length > 0) {
                const parsedCartItems = JSON.parse(cartItems); // Parse the cart items JSON string
                const order = parsedCartItems.map(item => ({
                    name: item.name,
                    userId: user._id,
                    productId: item.id, // Assuming the id in cartItems is the productId
                    quantity: item.quantity,
                    totalPrice: item.quantity // Replace with your actual price calculation logic
                }));

                await cart.insertMany(order);
            }
               
            return res.status(200).json({ message: 'Login successful', clearLocalStorage: true, redirectUrl: '/', token });
        } else {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.log("Found Error", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


exports.addCategory = async (req, res) => {
    let categories = await categoryData.find({ category: null })
    let email = req.session.email
    let user = await adminData.findOne({ email: email });
    res.render('add-category', { categories, user })
}

exports.add_category = async (req, res) => {

    let { name, slug, category, price } = req.body

    console.log("+++++++++++", req.body)

    const cat = new categoryData({
        name: name,
        image: req.file.filename,
        slug: slug,
        category: category || null,
        price: price || null
    });

    await cat.save();

    res.redirect("/add-category")

}

exports.sub_category = async (req, res) => {
    try {
        // Correctly extract the category ID from the query parameters
        let categoryId = req.query.categoryId;
        let user = req.session.email
        let cartItems = [];
        if (req.session.userId) {
            cartItems = await cart.find({ userId: req.session.userId });
        }
        // Ensure categoryId is not undefined or null
        let categories = await categoryData.find({ category: null })
        let subCategory = await categoryData.find({ category: categoryId });

        res.render('sub-category-page', { subCategory, categories, user, cartItems })
    } catch (error) {
        // Log and return any error encountered during the process
        console.error("Error retrieving subcategories:", error);
        res.status(500).send({ error: "An error occurred while retrieving subcategories" });
    }
};

exports.checkout = async (req, res) => {
    let user = req.session.email
    let cartItems = [];
    if (req.session.userId) {
        cartItems = await cart.find({ userId: req.session.userId });
    }
    // Extract productId from req.query
    const { productId } = req.query;
    const product = await categoryData.findOne({ _id: productId })

    //finding the customer'
    let customer = await adminData.findOne({ email: user });

    let categories = await categoryData.find({ category: null })
    res.render('checkout', { user, categories, product, cartItems, customer })
}

exports.view_product = async (req, res) => {
    res.render('view-product')
}

exports.signupp = async (req, res) => {
    
    try {
        let { email, password, cpassword } = req.body;
        let existingUser = await adminData.findOne({ email: email });

        if (existingUser) {
            // User already exists
            return res.status(400).json({ message: 'User already exists' });
        } else {
            if (password === cpassword) {
                const salt = await bcrypt.genSalt(10);
                const hashpass = await bcrypt.hash(password, salt);

                const newUser = new adminData({
                    email: email,
                    password: hashpass
                });

                await newUser.save();
                res.status(200).json({ redirectUrl: '/sign-in' });
            } else {
                res.status(400).json({ message: 'Passwords do not match' });
            }
        }
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


exports.edit = async (req, res) => {
    let email = req.session.email
    let user = await adminData.findOne({ email: email });
    res.render('edit-profile', { user })
}

exports.editt = async (req, res) => {
    console.log("+++++++++++++++", req.body)
}

exports.signout = async (req, res) => {
    let email = req.session.email
    let user = await adminData.findOne({ email: email });

    // If user is found, update the logged_in status
    if (user) {
        user.logged_in = false;
        await user.save();
    }
    req.session.email = null;
    res.redirect('/')
}