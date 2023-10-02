const bcrypt=require("bcrypt")
const nodemailer=require("nodemailer")
// const otpgenerator=require("otp-generator")
const randomstring = require('randomstring');
const collection= require("../model/mongodb");
const Products=require("../model/productmodel")
const CategoryCollection=require("../model/categorymodel")

const home= async(req,res)=>{
    console.log("Reached home");
    if(req.session.user){
        const isAuthenticated=true
        const categories=await CategoryCollection.find({blocked:false})
        const products=await Products.find({blocked:false})
        console.log(products);
        res.render("user/home",{isAuthenticated,products,categories})
    }else{
        const isAuthenticated=false
        const categories=await CategoryCollection.find({blocked:false})
        const products=await Products.find({blocked:false})
        console.log(products);
        res.render("user/home",{isAuthenticated,products,categories})
    }
}

const login = async (req, res) => {
    if(req.session.user){
        const isAuthenticated=true
        const err = req.query.err;
        const msg = req.query.msg;
        if (err === 'true') {
            res.render("user/login", { errmessage : msg, message : "" ,isAuthenticated});
        } else {
            res.render("user/login", { errmessage : "", message : msg ,isAuthenticated});
        }
    }else{
        const isAuthenticated=false
        const err = req.query.err;
        const msg = req.query.msg;
        if (err === 'true') {
            res.render("user/login", { errmessage : msg, message : "" ,isAuthenticated});
        } else {
            res.render("user/login", { errmessage : "", message : msg ,isAuthenticated});
        }
    }   
}

const logout=async(req,res)=>{
    
    res.redirect("/home")
}

// var loginwithoutotp=''
var globalEmail=" "

const dologin= async(req,res)=>{
    const email=req.body.email
    const password=req.body.password
    const data=await collection.findOne({email:email})
    const otp=data.otp
    console.log(otp);
    if(data){
        bcrypt.compare(password,data.password,(err,result)=>{
            if(result){
                if(!otp){    //loginwithoutotp
                    globalEmail=email
                    const isAuthenticated=false
                    res.render("user/otp",{isAuthenticated})
                }else{
                req.session.user=data
                res.redirect("/home")
                }
            }else{
                res.redirect(`/login?err=${true}&msg=Password donot match`);
            }
        })
    }else{
        res.redirect(`/login?err=${true}&msg=User not found`);
    }   

}

const signup=async(req,res)=>{
    console.log("reached signup");
    const err=req.query.err
    const msg=req.query.msg
    if(err){
        const isAuthenticated=false
        res.render("user/signup",{errmessage:msg,isAuthenticated})
    }else{
        const isAuthenticated=false
        res.render("user/signup",{isAuthenticated})
    }
}



const dosignup = async (req, res) => {
    const data = {
        username: req.body.username,
        email: req.body.email,
        mobile: req.body.mobile,
        password: req.body.password,
    }
    globalEmail=req.body.email
    const check = await collection.findOne({ email: data.email })
    const isAuthenticated=false
    if (check) {
        res.render("user/signup",{errordata:"email already exists",isAuthenticated})
    }else {
        const saltRounds=10
        bcrypt.hash(data.password,saltRounds,async(err,hashedpassword)=>{
            if(err){
                console.error("error in hashing password");
                res.status(500).send("error in hashing password")
            }else{
                data.password=hashedpassword
                await collection.insertOne(data)
                
                res.redirect("otp") 

            }
        })
    }

    console.log("Reached signup");
}

let generatedOTP=""

const sendOtp = async (req, res) => {
    console.log("reached otp");
    const isAuthenticated=false
    res.render("user/otp",{isAuthenticated})
    console.log("OTP Send");
    try {
       const email = globalEmail;
       console.log(email);
       const my_Mail = "nasrinkichlu3868@gmail.com";
       const my_password = "wpax dzbp aokr umut";  //otpgenerator
 
       const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          auth: {
             user: my_Mail,
             pass: my_password
          }
       });
 
       if (!email) {
          console.log("Email is missing");
          res.redirect(`/register?err=${true}&msg=Email is missing`);
       }
 
       // Function to generate and send OTP
       function sendOTP() {
        //   generatedOTP = otpgenerator.generate(6, {digits: true, upperCase: false, specialChars: false, alphabets: false });
          generatedOTP = randomstring.generate({
                    length: 6, // Set the length of your OTP
                    charset: 'numeric', // Use only numeric characters
                });
 
          console.log("generatedOTP " + generatedOTP);
          req.session.generatedOTP = generatedOTP;
          console.log("Session Stored OTP " + req.session.generatedOTP);
 
          const mailOptions = {
             from: my_Mail,
             to: email,
             subject: 'Your OTP Code',
             text: `Your OTP code is: ${generatedOTP}`,
          };
 
          transporter.sendMail(mailOptions, (error, info) => {
             if (error) {
                console.error('Error sending OTP:', error);
             } else {
                console.log('OTP sent:', info.response);
             }
          });
 
          // Invalidate the OTP after 1 minute
          setTimeout(() => {
             generatedOTP = null;
             console.log("OTP invalidated after 1 minute");
          }, 1 * 60 * 1000);
          
          
       }
       sendOTP();
 
    } catch (error) {
       console.log(error.message);
    }
 }


const validateotp=async(req,res)=>{
console.log("reached validateotp");
console.log("reached......=>")
    if(generatedOTP===req.body.enterotp){
        // Save OTP to MongoDB
        const email=globalEmail
        const save_otp=generatedOTP
        const isAuthenticated=true

        await collection.updateOne({email},{$set:{otp:save_otp}})
        res.render("user/home",{isAuthenticated})
    }else{
        const isAuthenticated=false
        res.render("user/otp", { errordata: "Invalid OTP", message: "" ,isAuthenticated})
    }
}

const resendotp=async(req,res)=>{
    res.redirect("/otp")
}
let emailcheck_for_forgetpassword=''
const Toemail=async(req,res)=>{
    console.log("reached emailprint for forgetpassword")
    const isAuthenticated=false
    res.render("user/forgetpassword",{isAuthenticated})
}


// let emailcheck_for_forgetpassword=''

const checkemail=async(req,res)=>{
    console.log("reached check email for forgetpassword")
    globalEmail=req.body.email
    const data=await collection.findOne({ email: globalEmail })
    if(data){
        console.log("reached to check email is valid")
        const isAuthenticated=false
        res.render("user/otp_password",{isAuthenticated})
    }else{
        const isAuthenticated=false
        res.render("user/forgetpassword",{errordata: "Invalid Email", message: "" ,isAuthenticated})
    }
}

const otpcheckpage=async(req,res)=>{
    const isAuthenticated=false
    console.log("reached otp for forget password");
    res.render("user/otp_password",{isAuthenticated})
}

const otpchecks=async(req,res)=>{
    console.log("reached otpcheck");
    // const isAuthenticated=false
    // res.render("user/otp_password",{isAuthenticated})
    console.log("OTP Send");
    try {
       const email = globalEmail;
       console.log(email);
       const my_Mail = "nasrinkichlu3868@gmail.com";
       const my_password = "wpax dzbp aokr umut";  //otpgenerator
 
       const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          auth: {
             user: my_Mail,
             pass: my_password
          }
       });
 
       if (!email) {
          console.log("Email is missing");
          res.redirect(`/forgetpassword?err=${true}&msg=Email is missing`);
       }
 
       // Function to generate and send OTP
       function sendOTP() {
        //   generatedOTP = otpgenerator.generate(6, {digits: true, upperCase: false, specialChars: false, alphabets: false });
          generatedOTP = randomstring.generate({
                    length: 6, // Set the length of your OTP
                    charset: 'numeric', // Use only numeric characters
                });
 
          console.log("generatedOTP " + generatedOTP);
          req.session.generatedOTP = generatedOTP;
          console.log("Session Stored OTP " + req.session.generatedOTP);
 
          const mailOptions = {
             from: my_Mail,
             to: email,
             subject: 'Your OTP Code',
             text: `Your OTP code is: ${generatedOTP}`,
          };
 
          transporter.sendMail(mailOptions, (error, info) => {
             if (error) {
                console.error('Error sending OTP:', error);
             } else {
                console.log('OTP sent:', info.response);
             }
          });
 
          // Invalidate the OTP after 1 minute
          setTimeout(() => {
             generatedOTP = null;
             console.log("OTP invalidated after 1 minute");
          }, 1 * 60 * 1000);
          
          
       }
       sendOTP();
 
    } catch (error) {
       console.log(error.message);
    }
}

const allpage=async(req,res)=>{
    console.log("reached all wears");
    
    if(req.session.user){
        const isAuthenticated=true
        const categories=await CategoryCollection.find({blocked:false})
        const products=await Products.find({blocked:false})
        res.render("user/all",{isAuthenticated,products,categories})
    }else{
        const isAuthenticated=false
        const categories=await CategoryCollection.find({blocked:false})
        const products=await Products.find({blocked:false})        
        res.render("user/all",{isAuthenticated,products,categories})   
    }    
}

const showbycategory=async(req,res)=>{
    console.log("reached showbycategory")
    if(req.session.user){
        const name=req.params.name   
        const isAuthenticated=true
        const categories=await CategoryCollection.find({blocked:false})
        const products=await Products.find({blocked:false,category:name})
        res.render("user/all",{isAuthenticated,products,categories})
    }else{
        const isAuthenticated=false
        const name=req.params.name
        const categories=await CategoryCollection.find({blocked:false})
        const products=await Products.find({blocked:false,category:name})        
        res.render("user/all",{isAuthenticated,products,categories})   
    }
}

const ethinicpage=async(req,res)=>{
    console.log("reached ethinic wears");
    
    if(req.session.user){
        const isAuthenticated=true
        const type = "Ethinic"; // Change 'dress' to 'type'
        const categories = await CategoryCollection.find({ blocked: false, type });
        const products = await Products.find({ blocked: false, type }); // Change 'category' to 'type'
        res.render("user/ethinic",{isAuthenticated,products,categories})
    }else{
        const isAuthenticated=false
        const type = "Ethinic"; // Change 'dress' to 'type'
        const categories = await CategoryCollection.find({ blocked: false, type });
        const products = await Products.find({ blocked: false, type }); // Change 'category' to 'type'
        console.log(products)        
        res.render("user/ethinic",{isAuthenticated,products,categories})   
    }    
}

const ethinicshowbycategory=async(req,res)=>{
    console.log("reached ethinicshowbycategory")
    if(req.session.user){
        const name=req.params.name  
        const isAuthenticated=true
        const type = "Ethinic";
        const categories = await CategoryCollection.find({ blocked: false, type });
        const products = await Products.find({ blocked: false,category:name, type });
        res.render("user/ethinic",{isAuthenticated,products,categories})
    }else{
        const isAuthenticated=false
        const name=req.params.name
        const type = "Ethinic";
        const categories = await CategoryCollection.find({ blocked: false, type });
        const products = await Products.find({ blocked: false,category:name, type });        
        res.render("user/ethinic",{isAuthenticated,products,categories})   
    }
}

const westernpage=async(req,res)=>{
    console.log("reached western wears");
    
    if(req.session.user){
        const isAuthenticated=true
        const type = "Western"; // Change 'dress' to 'type'
        const categories = await CategoryCollection.find({ blocked: false, type });
        const products = await Products.find({ blocked: false, type }); // Change 'category' to 'type'
        res.render("user/western",{isAuthenticated,products,categories})
    }else{
        const isAuthenticated=false
        const type = "Western"; // Change 'dress' to 'type'
        const categories = await CategoryCollection.find({ blocked: false, type });
        const products = await Products.find({ blocked: false, type }); // Change 'category' to 'type'
        console.log(products)        
        res.render("user/western",{isAuthenticated,products,categories})   
    }    
}

const westernshowbycategory=async(req,res)=>{
    console.log("reached westernshowbycategory")
    if(req.session.user){
        const name=req.params.name  
        const isAuthenticated=true
        const type = "Western";
        const categories = await CategoryCollection.find({ blocked: false, type });
        const products = await Products.find({ blocked: false,category:name, type });
        res.render("user/western",{isAuthenticated,products,categories})
    }else{
        const isAuthenticated=false
        const name=req.params.name
        const type = "Western";
        const categories = await CategoryCollection.find({ blocked: false, type });
        const products = await Products.find({ blocked: false,category:name, type });        
        res.render("user/western",{isAuthenticated,products,categories})   
    }
}

const sportspage=async(req,res)=>{
    console.log("reached sports wears");
    
    if(req.session.user){
        const isAuthenticated=true
        const type = "Sports"; // Change 'dress' to 'type'
        const categories = await CategoryCollection.find({ blocked: false, type });
        const products = await Products.find({ blocked: false, type }); // Change 'category' to 'type'
        res.render("user/sports",{isAuthenticated,products,categories})
    }else{
        const isAuthenticated=false
        const type = "Sports"; // Change 'dress' to 'type'
        const categories = await CategoryCollection.find({ blocked: false, type });
        const products = await Products.find({ blocked: false, type }); // Change 'category' to 'type'
        console.log(products)        
        res.render("user/sports",{isAuthenticated,products,categories})   
    }    
}

const Sportsshowbycategory=async(req,res)=>{
    console.log("reached Sportsshowbycategory")
    if(req.session.user){
        const name=req.params.name  
        const isAuthenticated=true
        const type = "Sports";
        const categories = await CategoryCollection.find({ blocked: false, type });
        const products = await Products.find({ blocked: false,category:name, type });
        res.render("user/sports",{isAuthenticated,products,categories})
    }else{
        const isAuthenticated=false
        const name=req.params.name
        const type = "Sports";
        const categories = await CategoryCollection.find({ blocked: false, type });
        const products = await Products.find({ blocked: false,category:name, type });        
        res.render("user/sports",{isAuthenticated,products,categories})   
    }
}

const productview=async(req,res)=>{
    console.log("reached productview")
    if(req.session.user){
        const id=req.params.id  
        const isAuthenticated=true
        const categories=await CategoryCollection.find({blocked:false})
        const product = await Products.findOne({_id:id});
        console.log(product);
        res.render("user/productview",{isAuthenticated,product,categories})
    }else{
        const isAuthenticated=false
        const id=req.params.id  
        const categories=await CategoryCollection.find({blocked:false})
        const product = await Products.findOne({_id:id});
        console.log(product);
        res.render("user/productview",{isAuthenticated,product,categories})  
    }

}

const wishlist=async(req,res)=>{
    console.log("Reached wishlist");
    if(req.session.user){
        const isAuthenticated=true
        res.render("user/wishlist",{isAuthenticated})
    }else{
        const isAuthenticated=false
        res.render("user/login",{isAuthenticated,errmessage : "You have to login to get wishlist", message : "" })
    }
}

const cart=async(req,res)=>{
    console.log("Reached cart");
    if(req.session.user){
        const isAuthenticated=true
        res.render("user/cart",{isAuthenticated})
    }else{
        const isAuthenticated=false
        res.render("user/login",{isAuthenticated,errmessage : "You have to login to get cart", message : "" })
    }
}

module.exports={
    home,login,signup,logout,dosignup,sendOtp,dologin,validateotp,resendotp,Toemail,checkemail,otpchecks,otpcheckpage,
    allpage,showbycategory,ethinicpage,ethinicshowbycategory,westernpage,westernshowbycategory,sportspage,Sportsshowbycategory,
    productview,wishlist,cart
}