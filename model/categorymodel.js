const mongoose=require ("mongoose")

const categoryschema = new mongoose.Schema({
    name:{
        type: String,
        required: true        
    },
    type:{
        type: String,
        required: true
    },
    blocked:{
        type : Boolean,
        default: false
    }
})


module.exports = mongoose.model("CategoryCollection", categoryschema);

