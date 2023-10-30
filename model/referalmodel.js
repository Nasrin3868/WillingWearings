const mongoose=require ("mongoose")

const referralschema = new mongoose.Schema({
    amount:{
        type: Number,
        default:0,
        required: true
    }
})


module.exports = mongoose.model("ReferralCollection", categoryschema);