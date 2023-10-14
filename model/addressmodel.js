const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true
   },
   address: {
     type: String,
    required: true
   },
   state: {
     type: String,
    required: true
   },
   district: {
     type: String,
    required: true
   },
   city: {
     type: String,
    required: true
   },
   pincode: {
     type: Number,
    required: true
   },
   mobile: {
     type: Number,
    required: true
   },
   userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'logincollection', 
    required: true,
  },
   blocked: {
    type: Boolean,
    default: false,
  }
})

module.exports = mongoose.model("addresscollection", addressSchema);
// module.exports = mongoose.model('address', addressModel, 'address');