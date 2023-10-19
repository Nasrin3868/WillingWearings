const mongoose=require("mongoose")
const productschema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    sellingprice: {
      type: Number,
      required: true,
    },
    created_on: {
      type: Date, default: Date.now()
    },
    category: {
    type: String,

    },
    size: {
      type: String,
      required: true,
    },
    colour: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    brand:{
      type:String,
      required:true,
    },
    stock: {
      type: Number,
      required: true,
    },
    blocked:{
      type : Boolean,
      default: false
    },
    images: [
      {
        type: String  // Assuming you store image URLs as strings
      }
    ],
  });
  module.exports = mongoose.model("productCollection", productschema);
//   module.exports=collection