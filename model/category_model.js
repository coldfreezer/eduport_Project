const mongoose = require("mongoose");
const { Schema } = mongoose

const categorySchema = new Schema({

name: {
  type: String,
  required:true
},
image: {
  type: String,
  default: null
},
slug: {
  type: String,
  default:null 
},
category :{
  type: Schema.Types.ObjectId,
  ref: 'categorycollections',
  default:null
},
price:{
   type : Number,
   default:0
}

}, {
timestamps: true, // Automatically adds createdAt and updatedAt fields
versionKey: false // Disables the __v field for versioning
});

const categoryData = new mongoose.model("categorycollections", categorySchema);
module.exports = categoryData;
