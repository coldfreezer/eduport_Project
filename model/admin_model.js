const mongoose = require("mongoose");
const { Schema } = mongoose

const adminSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },

  logged_in: { type: Boolean, default: false }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  versionKey: false // Disables the __v field for versioning
});


const admindata = new mongoose.model("adminCollection", adminSchema);
module.exports = admindata;
