const mongoose = require('mongoose');

  const orderSchema = new mongoose.Schema({
    items: [
        {
          product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'productCollection', // Reference to the Product model
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
          },
          sales_price: {
            type: Number,
            required: true,
          },
        },
    ],
    payment_method: {
      type: String,
      required: true,
      default:"Cash On Delivery"
    },
    couponDiscount:{
       type: Number,
       default:0
    },
    totalAmount:{
       type: Number,
       required:true,
    },
    actualTotalAmount:{
       type: Number,
       required:true
    },
    payment_status: {
      type: String,
      required: true,
      default:'Pending'
    },
    order_status: {
      type: String,
      required: true,
      default:'Placed'
    },
    created_on: {
      type: String,
      default: function () {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear().toString();
        return `${day}-${month}-${year}`;
      },
    },
    expected_delivery_on: {
      type: String,
      default: function () {
        const now = new Date();
        const day = now.getDate() + 5;
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear().toString();
        return `${day}-${month}-${year}`;
      },
    },
    delivered_on: {
      type: Date,
      default: null
    },
    return_Reason:{
      type: String,
      default:null,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'logincollection', 
      required: true,
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'addresscollection', 
      required: true
      },
  });

module.exports = mongoose.model("ordercollection", orderSchema);
