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

function generateRandomCouponCode() {
    const length = 10;
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let couponCode = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        couponCode += charset.charAt(randomIndex);
    }
    return couponCode;
}

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
    cart:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'productCollection'
            },
            quantity:{
                type:Number,
                default:1
            }
        }
    ],
    wishlist:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'productCollection'
        }
    ],
    address:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'addresscollection'
        }
    ],
    otp:{
        type:Number,
        default: null
    },
    wallet:{
        type:Number,
        default:0
    },
    referral_code:{
        type:String,
        default: function generateRandomCouponCode(){
            const length = 10;
            const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            let couponCode = "";
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * charset.length);
                couponCode += charset.charAt(randomIndex);
            }
            return couponCode;
        }
    },
    referral_count:{
        type:Number,
        default:0
    }
});
const collection=mongoose.model("logincollection",loginSchema)
module.exports=collection