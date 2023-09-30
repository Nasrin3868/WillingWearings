const mongoose=require("mongoose")
mongoose
    .connect("mongodb://127.0.0.1:27017/willing_wearings")
    .then(()=>{
        console.log("mongodb connected");
    })
    .catch((err)=>{
        console.log("error something went wrong");
        console.log(err)
    });

const loginSchema=new mongoose.Schema({
    username:{
        type: String,
        required: true,
    },
    email:{
        type:String,
        required: true
    },
    mobile:{
        type: Number,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },
    blocked:{
        type: Boolean,
       default : false
    },
    otp:{
        type:Number,
        default: null
    }
});
const collection=mongoose.model("logincollection",loginSchema)
module.exports=collection