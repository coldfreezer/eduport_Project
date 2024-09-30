const mongoose = require('mongoose');
const { Schema } = mongoose

const cartSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'adminCollection',
    required: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'categorycollections',
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  totalPrice: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  versionKey: false // Disables the __v field for versioning
});
const cart = mongoose.model('cartCollection', cartSchema);

module.exports = cart;