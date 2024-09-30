const mongoose = require("mongoose");
const { Schema } = mongoose

const orderSchema = new Schema({

    productId: {
        type: Schema.Types.ObjectId,
        ref: 'categorycollections',
        required: true
    },
    order_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required:true
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'adminCollection',
        required: true
    },
    transaction_Id:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
        required: true
    }

}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    versionKey: false // Disables the __v field for versioning
});

const categoryData = new mongoose.model("ordercollections", orderSchema);
module.exports = categoryData;
