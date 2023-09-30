const mongoose=require("mongoose")

const categoryschema = new mongoose.Schema({
    name:{
        type: String,
        default: active
    }
})


const admincollection = mongoose.model("CategoryCollection", categoryschema);
module.exports=admincollection
