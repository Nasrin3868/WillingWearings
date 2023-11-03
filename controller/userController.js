const bcrypt=require("bcrypt")
const nodemailer=require("nodemailer")
const randomstring = require('randomstring');
const collection = require("../model/mongodb");
const Products=require("../model/productmodel")
const CategoryCollection=require("../model/categorymodel")
const Address= require("../model/addressmodel");
const { Collection } = require("mongoose");
const Orders=require("../model/ordermodel")
const userHelper = require('../helper/razorPay');
const CouponCollection=require("../model/couponmodel")
const ReferralCollection=require("../model/referralmodel")


let discount=''
let coupon_code=''

const home=async(req,res)=>{
    discount=''
    coupon_code=''
    const isAuthenticated=false
    const categories=await CategoryCollection.find({blocked:false})
    const products=await Products.find({blocked:false})
    if(req.query.range){
        if(req.query.range=='high'){
            products.sort((a, b) => b.sellingprice - a.sellingprice);
        }else if(req.query.range=='low'){
            products.sort((a, b) => a.sellingprice - b.sellingprice)
        }
    }
    res.render("user/home",{isAuthenticated,products,categories,user:''})
}

const loadHomeAfterLogin= async(req,res)=>{
    discount=''
    coupon_code=''
    console.log("Reached home");
    const userId = req.query.userId;
    const value='home'
    if (req.session.user) {
        const isAuthenticated = true;
        const categories = await CategoryCollection.find({ blocked: false });
        const products = await Products.find({ blocked: false });
        if(req.query.range){
            if(req.query.range=='high'){
                products.sort((a, b) => b.sellingprice - a.sellingprice);
            }else if(req.query.range=='low'){
                products.sort((a, b) => a.sellingprice - b.sellingprice)
            }
        }
        const user=await collection.findById(req.session.user).populate('cart.product')
        console.log("user:",user)
        res.render("user/home", { isAuthenticated, products, categories,user});
        
    } else {
        res.redirect("/");
    }
}

const login = async (req, res) => {
    if(req.session.user){
        const categories=await CategoryCollection.find({blocked:false})
        const isAuthenticated=true
        const err = req.query.err;
        const msg = req.query.msg;
        if (err === 'true') {
            res.render("user/login", { errmessage : msg, message : "" ,isAuthenticated,categories});
        } else {
            res.render("user/login", { errmessage : "", message : msg ,isAuthenticated,categories});
        }
    }else{
        const categories=await CategoryCollection.find({blocked:false})
        const isAuthenticated=false
        const err = req.query.err;
        const msg = req.query.msg;
        if (err === 'true') {
            res.render("user/login", { errmessage : msg, message : "" ,isAuthenticated,categories});
        } else {
            res.render("user/login", { errmessage : "", message : msg ,isAuthenticated,categories});
        }
    }   
}

const logout=async(req,res)=>{
    res.redirect("/home")
}

var globalEmail=" "
var otps

const dologin= async(req,res)=>{
    const emails=req.body.email
    const password=req.body.password
    const categories=await CategoryCollection.find({blocked:false})
    const data=await collection.findOne({email:emails})
    if(data){
        otps=data.otp
        console.log(otps);
    }
    
    if(data&&data.blocked==false){
        bcrypt.compare(password,data.password,(err,result)=>{
            if(result){
                if(!otps){    //loginwithoutotp
                    globalEmail=emails
                    const isAuthenticated=false
                    res.render("user/otp",{isAuthenticated,categories})
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
                }else{
                req.session.user=data
                res.redirect('/home');
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
    const categories=await CategoryCollection.find({blocked:false})
    if(err){
        const isAuthenticated=false
        res.render("user/signup",{errmessage:msg,isAuthenticated,categories})
    }else{
        const isAuthenticated=false
        res.render("user/signup",{isAuthenticated,categories})
    }
}


const dosignup = async (req, res) => {
    const user=await collection.findOne({referral_code:req.body.referral})
    console.log("code:",req.body.referral);
    
    console.log("user details:",user);
    const referral=await ReferralCollection.findOne()
    let data
    if(user){
        // const refferal_count=user.refferal_count++
        data = {
            username: req.body.username,
            email: req.body.email,
            mobile: req.body.mobile,
            password: req.body.password,
            wallet:referral.referee
        }
        await collection.findOneAndUpdate({referral_code:req.body.referral},{$inc: { wallet: referral.referee, referral_count: 1 }})
    }else{
        data = {
            username: req.body.username,
            email: req.body.email,
            mobile: req.body.mobile,
            password: req.body.password,
        }
    }
    globalEmail=req.body.email
    const check = await collection.findOne({ email: data.email })
    const categories=await CategoryCollection.find({blocked:false})
    const isAuthenticated=false
    if (check) {
        res.render("user/signup",{errordata:"email already exists",isAuthenticated,categories})
    }else {
        const saltRounds=10
        bcrypt.hash(data.password,saltRounds,async(err,hashedpassword)=>{
            if(err){
                console.error("error in hashing password");
                res.status(500).send("error in hashing password")
            }else{
                data.password=hashedpassword
                const newUser = new collection(data);

        try {
          await newUser.save(); 
          res.redirect('otp');
        } catch (err) {
          console.error('Error while saving user:', err);
          res.status(500).send('Error while saving user');
        }

            }
        })
    }
    console.log("Reached signup");
}

let generatedOTP=""

const sendOtp = async (req, res) => {
    console.log("reached otp");
    const isAuthenticated=false
    const categories=await CategoryCollection.find({blocked:false})
    res.render("user/otp",{isAuthenticated,categories})
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
    if(generatedOTP===req.body.enterotp){
        // Save OTP to MongoDB
        const email=globalEmail
        const save_otp=generatedOTP
        const isAuthenticated=true
        const categories=await CategoryCollection.find({blocked:false})
        const products=await Products.find({blocked:false})
        await collection.updateOne({email},{$set:{otp:save_otp}})
        res.redirect('login');
    }else{
        const isAuthenticated=false
        res.render("user/otp", { errordata: "Invalid OTP", message: "" ,isAuthenticated,categories})
    }
}

const resendotp=async(req,res)=>{
    res.redirect("/otp")
}
let emailcheck_for_forgetpassword=''
const Toemail=async(req,res)=>{
    console.log("reached emailprint for forgetpassword")
    const isAuthenticated=false
    const categories=await CategoryCollection.find({blocked:false})
    res.render("user/forgetpassword",{errmessage:"",isAuthenticated,categories})
}


// let emailcheck_for_forgetpassword=''

const checkemail=async(req,res)=>{
    console.log("reached check email for forgetpassword")
    globalEmail=req.body.email
    const data=await collection.findOne({ email:globalEmail})
    const categories=await CategoryCollection.find({blocked:false})
    if(data){
        if(data.blocked==true){
            const isAuthenticated=false
            res.render("user/forgetpassword",{errmessage: "User not found",isAuthenticated,categories})
        }else{
            console.log("reached to check email is valid")
            const isAuthenticated=false
            res.redirect("/otpcheck")
        }
    }else{
        const isAuthenticated=false
        res.render("user/forgetpassword",{errmessage: "Invalid Email",isAuthenticated,categories})
    }
}

const otpcheckpage=async(req,res)=>{
    const isAuthenticated=false
    const categories=await CategoryCollection.find({blocked:false})
    console.log("reached otp for forget password");
    res.render("user/otp_password",{isAuthenticated,categories})
    console.log("OTP Send");
            try {
                console.log(globalEmail);
                const email = globalEmail;
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
            }
            catch (error) {
                console.log(error.message);
            }
}

const otpchecks=async(req,res)=>{
    console.log("reached otpcheck");
    const categories=await CategoryCollection.find({blocked:false})
    if(generatedOTP===req.body.enterotp){
        res.redirect("/confirmpassword")
    }else{
        const isAuthenticated=false
        res.render("user/otp_password", { errordata: "Invalid OTP", message: "" ,isAuthenticated,categories})
    }
    
}

const resendOTP_for_forgrtpassword=async(req,res)=>{
    res.redirect("/otpcheck")
}

const confirmpassword=async(req,res)=>{
    const categories=await CategoryCollection.find({blocked:false})
    const isAuthenticated=false
    res.render("user/confirmpassword",{isAuthenticated,categories})
}

const confirm_password_check=async(req,res)=>{
    const categories=await CategoryCollection.find({blocked:false})
    const isAuthenticated=false
    const password=req.body.password
    const email=globalEmail
    console.log(email);
    const saltRounds=10
    bcrypt.hash(password,saltRounds,async(err,hashedpassword)=>{
        if(err){
            console.error("error in hashing password");
            res.status(500).send("error in hashing password")
        }else{
            // password=hashedpassword
            await collection.updateOne({ email: email }, { $set: { password: hashedpassword } })
            res.render("user/login",{isAuthenticated,categories,errmessage:"",message:""}) 
        }
    })
}
let searchname=''
const searchProducts=async(req,res)=>{
    searchname = req.body.search;
    res.redirect("/searchCategory")
    // const searchname = req.body.search;
    // res.redirect(`/searchCategory?name=${searchname}`)
}

const searchProduct=async(req,res)=>{
    console.log("reached searchCategory");
    const name = searchname;
    // const name = req.query.name;
    const regex = new RegExp(`^${name}`, "i");
    const products = await Products.find({ name: { $regex: regex } })
    const categories=await CategoryCollection.find({blocked:false})
    if(req.query.range){
        if(req.query.range=='high'){
            products.sort((a, b) => b.sellingprice - a.sellingprice);
        }else if(req.query.range=='low'){
            products.sort((a, b) => a.sellingprice - b.sellingprice)
        }
    }
    if(req.session.user){
        const user=await collection.findById(req.session.user).populate('cart.product')
        res.render("user/searchProduct",{isAuthenticated:true,products,categories,user,value:'all'})
    }else{
        res.render("user/searchProduct",{isAuthenticated:false,products,categories,user:'',value:'all'})   
    }
}  

const allpage=async(req,res)=>{
    console.log("reached all wears");
    discount=''
    coupon_code=''
    const categories=await CategoryCollection.find({blocked:false})
    const products=await Products.find({blocked:false})
    if(req.query.range){
        if(req.query.range=='high'){
            products.sort((a, b) => b.sellingprice - a.sellingprice);
        }else if(req.query.range=='low'){
            products.sort((a, b) => a.sellingprice - b.sellingprice)
        }
    }
    if(req.session.user){
        const user=await collection.findById(req.session.user).populate('cart.product')
        res.render("user/all",{isAuthenticated:true,products,categories,user,value:'all'})
    }else{
        res.render("user/all",{isAuthenticated:false,products,categories,user:'',value:'all'})   
    }    
}

const showbycategory=async(req,res)=>{
    console.log("reached showbycategory")
    const categoryname=req.params.name
    const category = await CategoryCollection.findOne({ name: categoryname,blocked: false });
    const categoryId = category._id;
    const products = await Products.find({ blocked: false, category: categoryId});
    const categories = await CategoryCollection.find({ blocked: false});  
    if(req.query.range){
        if(req.query.range=='high'){
            products.sort((a, b) => b.sellingprice - a.sellingprice);
        }else if(req.query.range=='low'){
            products.sort((a, b) => a.sellingprice - b.sellingprice)
        }
    }
    if(req.session.user){
        const user=await collection.findById(req.session.user).populate('cart.product')
        res.render("user/all",{isAuthenticated:true,products,categories,user,value:'all_cat',categoryname})
    }else{
        res.render("user/all",{isAuthenticated:false,products,categories,user:'',value:'all_cat',categoryname})   
    }
}

const ethinicpage=async(req,res)=>{
    console.log("reached ethinic wears");
    discount=''
    coupon_code=''
    const type = "Ethinic"; // Change 'dress' to 'type'
    const categories = await CategoryCollection.find({ blocked: false, type });
    const categoryIds = categories.map(category => category._id);
    const products = await Products.find({ blocked: false, category: { $in: categoryIds } });
    if(req.query.range){
        if(req.query.range=='high'){
            products.sort((a, b) => b.sellingprice - a.sellingprice);
        }else if(req.query.range=='low'){
            products.sort((a, b) => a.sellingprice - b.sellingprice)
        }
    }
    if(req.session.user){
        const user=await collection.findById(req.session.user).populate('cart.product')
        res.render("user/ethinic", { isAuthenticated:true, products, categories,user,value:'all' });
    }else{
        res.render("user/ethinic",{isAuthenticated:false,products,categories,user:'',value:'all'})   
    }    
}

const ethinicshowbycategory=async(req,res)=>{
    console.log("reached ethinicshowbycategory")
    const categoryname=req.params.name
    const type = "Ethinic";
    const category = await CategoryCollection.findOne({ name: categoryname, type, blocked: false });
    const categoryId = category._id;
    const products = await Products.find({ blocked: false, category: categoryId, type });
    const categories = await CategoryCollection.find({ blocked: false, type });
    if(req.query.range){
        if(req.query.range=='high'){
            products.sort((a, b) => b.sellingprice - a.sellingprice);
        }else if(req.query.range=='low'){
            products.sort((a, b) => a.sellingprice - b.sellingprice)
        }
    }
    if(req.session.user){
        const user=await collection.findById(req.session.user).populate('cart.product')
        res.render("user/ethinic",{isAuthenticated:true,products,categories,user,categoryname,value:'all_cat'})
    }else{
        res.render("user/ethinic",{isAuthenticated:false,products,categories,user:'',categoryname,value:'all_cat'})   
    }
}

const westernpage=async(req,res)=>{
    console.log("reached western wears");
    discount=''
    coupon_code=''
    const type = "Western"; // Change 'dress' to 'type'
    const categories = await CategoryCollection.find({ blocked: false, type });
    const categoryIds = categories.map(category => category._id);
    const products = await Products.find({ blocked: false, category: { $in: categoryIds } });
    if(req.query.range){
        if(req.query.range=='high'){
            products.sort((a, b) => b.sellingprice - a.sellingprice);
        }else if(req.query.range=='low'){
            products.sort((a, b) => a.sellingprice - b.sellingprice)
        }
    }
    if(req.session.user){
        const user=await collection.findById(req.session.user).populate('cart.product')
        res.render("user/western", { isAuthenticated:true, products, categories,user,value:'all' });
    }else{
        res.render("user/western",{isAuthenticated:false,products,categories,user:'',value:'all'})   
    }    
}

const westernshowbycategory=async(req,res)=>{
    console.log("reached westernshowbycategory")
    const categoryname=req.params.name
    const type = "Western";
    const category = await CategoryCollection.findOne({ name: categoryname, type, blocked: false });
    const categoryId = category._id;
    const products = await Products.find({ blocked: false, category: categoryId, type });
    const categories = await CategoryCollection.find({ blocked: false, type }); 
    if(req.query.range){
        if(req.query.range=='high'){
            products.sort((a, b) => b.sellingprice - a.sellingprice);
        }else if(req.query.range=='low'){
            products.sort((a, b) => a.sellingprice - b.sellingprice)
        }
    }
    if(req.session.user){
        const user=await collection.findById(req.session.user).populate('cart.product')
        res.render("user/western",{isAuthenticated:true,products,categories,user,categoryname,value:'all_cat'})
    }else{
        const isAuthenticated=false       
        res.render("user/western",{isAuthenticated:false,products,categories,user:'',categoryname,value:'all_cat'})   
    }
}

const sportspage=async(req,res)=>{
    console.log("reached sports wears");
    discount=''
    coupon_code=''
    const type = "Sports"; // Change 'dress' to 'type'
    const categories = await CategoryCollection.find({ blocked: false, type });
    const categoryIds = categories.map(category => category._id);
    const products = await Products.find({ blocked: false, category: { $in: categoryIds } });
    if(req.query.range){
        if(req.query.range=='high'){
            products.sort((a, b) => b.sellingprice - a.sellingprice);
        }else if(req.query.range=='low'){
            products.sort((a, b) => a.sellingprice - b.sellingprice)
        }
    }
    if(req.session.user){
        const user=await collection.findById(req.session.user).populate('cart.product')
        res.render("user/sports",{isAuthenticated:true,products,categories,user,value:'all'})
    }else{
        const isAuthenticated=false
        res.render("user/sports",{isAuthenticated:false,products,categories,user:'',value:'all'})   
    }    
}

const Sportsshowbycategory=async(req,res)=>{
    console.log("reached Sportsshowbycategory")
    const categoryname=req.params.name
    const type = "Sports";
    const category = await CategoryCollection.findOne({ name: categoryname, type, blocked: false });
    const categoryId = category._id;
    const products = await Products.find({ blocked: false, category: categoryId, type });
    const categories = await CategoryCollection.find({ blocked: false, type });
    if(req.query.range){
        if(req.query.range=='high'){
            products.sort((a, b) => b.sellingprice - a.sellingprice);
        }else if(req.query.range=='low'){
            products.sort((a, b) => a.sellingprice - b.sellingprice)
        }
    }
    if(req.session.user){
        const user=await collection.findById(req.session.user).populate('cart.product')
        res.render("user/sports",{isAuthenticated:true,products,categories,user,categoryname,value:'all_cat'})
    }else{
        res.render("user/sports",{isAuthenticated:false,products,categories,user:'',categoryname,value:'all_cat'})   
    }
}

const productview=async(req,res)=>{
    console.log("reached productview")
        if(req.session.user){
        const id=req.params.id  
        const isAuthenticated=true
        const categories=await CategoryCollection.find({blocked:false})
        const product = await Products.findOne({_id:id});
        const user=await collection.findById(req.session.user._id).populate('wishlist').populate('cart.product')
        res.render("user/productview",{isAuthenticated,product,categories,user})
    }else{
        const isAuthenticated=false
        const id=req.params.id  
        const categories=await CategoryCollection.find({blocked:false})
        const product = await Products.findOne({_id:id});        
        res.render("user/productview",{isAuthenticated,product,categories,user:''})  
    }

}

const wishlist=async(req,res)=>{
    discount=''
    coupon_code=''
    console.log("Reached wishlist");
    const isAuthenticated=true
    const categories=await CategoryCollection.find({blocked:false})
    const user=await collection.findById(req.session.user._id).populate('wishlist').populate('cart.product')
    res.render("user/wishlist",{isAuthenticated,categories,userdata:user})
    
}

const updateWishlist = async (req, res) => {
    console.log("reached updateWishlist");
    const productId = req.params.id;
    const user = await collection.findById(req.session.user._id).populate('wishlist');
    const index = user.wishlist.findIndex((item) => item._id.equals(productId)); // Check if the product is in the wishlist
    if (index === -1) {
        user.wishlist.push(productId);
    } else {
        user.wishlist.splice(index, 1);
    }
    await user.save();
    return res.json({ status: true });
}

const wishlistToCart=async(req,res)=>{
    console.log("reached wishlistToCart");
    const productId=req.params.id
    const product = await Products.findById(productId);
    const userId = req.session.user._id;
    const user = await collection.findOne({ _id: userId });
    const existingCartItem = user.cart.find(item => item.product.toString() === productId);

    // Update the cart based on whether the product exists or not
    if (existingCartItem) {
        if(product.stock > existingCartItem.quantity){
            existingCartItem.quantity++;
            const index=user.wishlist.findIndex((item) => item._id.equals(productId))
            user.wishlist.splice(index, 1);
        }else{
            existingCartItem.quantity=existingCartItem.quantity;
            const index=user.wishlist.findIndex((item) => item._id.equals(productId))
            user.wishlist.splice(index, 1);
        }
    } else {
        if(product.stock===0){
            user.cart.push({
                product: productId,
                quantity: 0
            });
        }else{
            user.cart.push({
                product: productId,
                quantity: 1
            });
            const index=user.wishlist.findIndex((item) => item._id.equals(productId))
            user.wishlist.splice(index, 1);
        }
    }
    await user.save();
    res.json({ status: true });
}

const wishlistProductDelete=async(req,res)=>{
    console.log("Reached wishlistProductDelete");
    const productId=req.params.id
    const userId = req.session.user._id;
    const user = await collection.findOne({ _id: userId }).populate('wishlist');
    const productIndex = user.wishlist.findIndex((item) => item.toString() === productId)
    user.wishlist.splice(productIndex, 1);
    await user.save();
    res.redirect("/wishlist")
}

const doCart = async (req, res) => {
    const productId = req.params.id;
    const product = await Products.findById(productId);
    
    const userId = req.session.user._id;
    const user = await collection.findOne({ _id: userId });
    const existingCartItem = user.cart.find(item => item.product.toString() === productId);

    if (existingCartItem) {
        if(product.stock > existingCartItem.quantity){
            existingCartItem.quantity++;
        }else{
            existingCartItem.quantity=existingCartItem.quantity;
        }
    } else {
        if(product.stock==0){
            user.cart.push({
                product: productId,
                quantity: 0
            });
        }else{
            user.cart.push({
                product: productId,
                quantity: 1
            });
        }
    }
    await user.save();
    const userdata=await collection.findById(userId).populate('cart.product')
    
};


const productQuantityUpdate = async (req, res) => {
    console.log("Reached productQuantityUpdate");
   
    if (req.session.user) {
        const userId = req.session.user._id;
        const cartItem = req.body;
        console.log(cartItem);
        const user = await collection.findOne({ _id: userId });
        const CartItem = user.cart.find(item => item.product.toString() === cartItem);
        
        if (CartItem) {
            CartItem.quantity++ 
            console.log(CartItem);
            await user.save();
            const msg = "Product updated successfully";
            return res.json({ msg });
        } else {
            const msg = "Product not updated";
            return res.json({ msg });
        }
    } else {
        return res.redirect("/login");
    }
}


const cartUpdate = async (req, res) => {
    console.log("reached cartupdate");
    try {
      const userId = req.session.user._id;
      const { productid, quantity, total } = req.body;
      const user = await collection.findOne({ _id: userId });
      const CartItem = user.cart.find(item => item.product.toString() === productid);
      CartItem.quantity = quantity;
      let cartSubtotal = 0;
    user.cart.forEach(cartItem => {
        cartSubtotal += cartItem.product.sellingprice * cartItem.quantity;
    });
      await user.save();
      return res.status(200).json({ message: "Cart updated successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

const calculateCartSubtotal = (user) => {
    let cartSubtotal = 0;
    user.cart.forEach(cartItem => {
        cartSubtotal += cartItem.product.sellingprice * cartItem.quantity;
    });
    return cartSubtotal;
};

const calculateCartTotal=(user)=>{
    let cartTotal = 0;
    user.cart.forEach(cartItem => {
        cartTotal += cartItem.product.price * cartItem.quantity;
    });
    return cartTotal;
}

const cart = async (req, res) => {
    discount=''
    coupon_code=''
    console.log("Reached cart");
    const userId = req.session.user._id;
    const user = await collection.findById(userId).populate('cart.product');
    const categories = await CategoryCollection.find({ blocked: false });

    // Calculate the cart subtotal using calculateCartSubtotal function
    const cartSubtotal = calculateCartSubtotal(user);
    res.render("user/cart", {isAuthenticated: true,
        categories,
        userdata: user,
        cartSubtotal: cartSubtotal,
    });
};

const cartproductdelete=async(req,res)=>{
    console.log("Reached cartproductdelete");
    const productId=req.params.id
    const userId = req.session.user._id;
    const user = await collection.findOne({ _id: userId });
    const productIndex = user.cart.findIndex((item) => item.product.toString() === productId)
    user.cart.splice(productIndex, 1);
    await user.save();
    res.redirect("/cart")

}

let categoryDiscount=''

const placeorder = async (req, res) => {
    discount=''
    coupon_code=''
    const userId = req.session.user._id;
    let offer=req.query.offer
    const errmessage=req.query.errmessage
    const msg=req.query.msg
    const user = await collection.findById(userId)
    .populate({
        path: 'cart.product',
        populate: {
            path: 'category',
            model: 'CategoryCollection'
        }
    });
    console.log("user:",user);
    // Create a map to track category discounts
    const categoryDiscountMap = new Map();

    // Iterate through the user's cart to calculate the category discount
    user.cart.forEach(cartItem => {
        const categoryId = cartItem.product.category._id;
        const discountPercentage = cartItem.product.category.discount_percentage;
        const sales_price=cartItem.product.sellingprice
        const from=cartItem.product.category.valid_from
        const to=cartItem.product.category.valid_to
        const today=new Date()
        if(today>=from&&today<=to){
            if (!categoryDiscountMap.has(categoryId)) {
                categoryDiscountMap.set(categoryId, {discountPercentage,sales_price});
            }
        }
    });
    console.log(categoryDiscountMap);
    // Sum the unique category discounts
    categoryDiscount = parseFloat(Array.from(categoryDiscountMap.values()).reduce((acc, { discountPercentage, sales_price }) => acc + (discountPercentage / 100) * sales_price, 0).toFixed(2));

    const categories = await CategoryCollection.find({ blocked: false });
    const cartSubtotal = calculateCartSubtotal(user);

    res.render("user/placeorder", {
        isAuthenticated: true,
        categories,
        total: cartSubtotal,
        categoryDiscount,
        offer,errmessage,msg
    });
}

const coupon=async(req,res)=>{
    console.log("reached coupon list");
    const userId=req.session.user._id
    const unredeemedCoupons = await CouponCollection.find({redeemed_users: { $ne: userId },blocked:false});
    const categories = await CategoryCollection.find({ blocked: false });
    res.render("user/coupon",{Coupon:unredeemedCoupons,categories,isAuthenticated:true})
}

const applyCoupon=async(req,res)=>{
    console.log("reached applyCoupon");
    const userId=req.session.user._id
    const user = await collection.findById(userId).populate('cart.product');
    const categories = await CategoryCollection.find({ blocked: false });
    // Calculate the cart subtotal using the defined function
    const cartSubtotal = calculateCartSubtotal(user);
    coupon_code=req.body.Coupon
    const today=new Date()
    const coupon=await CouponCollection.find({coupon_code:coupon_code})
    if(coupon[0].min_order > cartSubtotal){
        res.redirect("/placeorder?offer=0&&errmessage=Can't apply this coupon.Your Ordered amount is low&&msg")
    }else if(coupon[0].valid_to<today){
        res.redirect("/placeorder?offer=0&&errmessage=Coupon expired&&msg")
    }else{
        // await CouponCollection.findOneAndUpdate({ coupon_code: coupon_code }, { $push: { redeemed_users: userId } });
        const amount=((coupon[0].discount_percentage/100)*cartSubtotal)
        if(amount>coupon[0].max_discount){
            discount=coupon[0].max_discount
            res.render("user/placeorder", {isAuthenticated: true,categories,total: cartSubtotal,offer:'',discount,categoryDiscount,errmessage:'',msg:"Coupon applied Successfully"});
        }else{
            discount=amount
            res.render("user/placeorder", {isAuthenticated: true,categories,total: cartSubtotal,offer:'',discount,categoryDiscount,errmessage:'',msg:"Coupon applied Successfully"});
        }
    }
}

const checkout=async(req,res)=>{
    console.log("reached checkout page");
    const err = req.query.err;
    const msg = req.query.msg;
    let coupondiscount=discount
    if(discount==''){
        coupondiscount=0
    }
    
    const userId = req.session.user._id;
    const user = await collection.findById(userId).populate('cart.product')
    .populate({
        path: 'cart.product',
        populate: {
            path: 'category',
            model: 'CategoryCollection'
        }
    });
    const today=new Date()
    const useraddress = await Address.find({ userId, blocked: false });
    const categories = await CategoryCollection.find({ blocked: false });
    const cartSubtotal = calculateCartSubtotal(user);
    if (err === 'true') {
        res.render("user/checkout", { errmessage : msg, message : "" ,isAuthenticated:true,categories,user,cartSubtotal,categoryDiscount,today,coupondiscount,useraddress});
    } else {
        res.render("user/checkout", { errmessage : "", message : msg ,isAuthenticated:true,categories,user,cartSubtotal,categoryDiscount,today,coupondiscount,useraddress});
    }
}
  
const addAddress=async(req,res)=>{
    console.log("reached addAddress");
    const org=req.query.org
    const categories = await CategoryCollection.find({ blocked: false });
    res.render("user/addAddress",{isAuthenticated:true,categories,org})
}

const newAddress=async(req,res)=>{
    console.log("reached newAddress");
    const msg=req.query.org
    const name= req.body.username
    const address= req.body.address
    const state= req.body.state
    const district= req.body.district
    const city= req.body.city
    const pincode= req.body.pincode
    const mobile= req.body.mobileno
    const userId=req.session.user._id
    
    const data = new Address({
        name,
        address,
        state,
        district,
        city,
        pincode,
        mobile,
        userId
      });
    // const newAddress=new Address(data)
    await data.save()
    let saveAddress= await collection.findByIdAndUpdate(userId,{$push: {address: data.userId}})
    if(msg=='account'){
        res.redirect("/myaccount")
    }else if(saveAddress){
        res.redirect(`/checkout?err=${""}&msg=New address added successfully`)
    }
   
}

const editAddress=async(req,res)=>{
    console.log("reached editAddress")
    const addressId=req.params.id
    const editaddress= await Address.findById(addressId)
    const categories = await CategoryCollection.find({ blocked: false });
    const org=req.query.org
    console.log(org);
    res.render("user/editAddress",{isAuthenticated:true,categories,editaddress,org})
}

const editedAddress=async(req,res)=>{
    console.log("reached editedAddress");
    const msg=req.query.org
    console.log(msg)
    const addressId=req.params.id
    const name= req.body.username
    const address= req.body.address
    const state= req.body.state
    const district= req.body.district
    const city= req.body.city
    const pincode= req.body.pincode
    const mobile= req.body.mobileno
    await Address.findOneAndUpdate({ _id: addressId }, { name: name,address:address,state:state,district:district,city:city,pincode:pincode,mobile:mobile});
    if(msg=='account'){
        res.redirect("/myaccount")
    }else{
        res.redirect("/checkout")
    }
}
const deleteAddress = async (req, res) => {
    console.log("reached deleteAddress");
    const addressId = req.params.id;
    const orderWithAddress = await Orders.findOne({ address: addressId });
    if (orderWithAddress) {
        await Address.findOneAndUpdate({ _id: addressId }, { blocked: true });
    } else {
        await Address.findByIdAndRemove(addressId);
        const userId = req.session.user._id;
        await collection.updateOne(
            { _id: userId },
            { $pop: { address: 1 } } 
        );
    }
    res.redirect("/myaccount");
}

const myaccount = async (req, res) => {
    console.log("reached myaccount");
    const categories = await CategoryCollection.find({ blocked: false });
    const userId = req.session.user._id;
    const user = await collection.findById(userId);
    const useraddress = await Address.find({ userId, blocked: false });
    const orders = await Orders.find({ user_id: userId }).populate('address').populate('items.product_id');
    // Calculate the total quantity for each order
    const ordersWithQuantity = orders.map(order => {
        const totalQuantity = order.items.reduce((acc, item) => acc + item.quantity, 0);
        return {
            ...order.toObject(),
            quantity: totalQuantity,
        };
    });
    res.render("user/myaccount", { isAuthenticated: true, categories, Address: useraddress, user, order: ordersWithQuantity });
}

const placedOrder = async (req, res) => {
    console.log("reached placedOrder");
    const categories = await CategoryCollection.find({ blocked: false });
    const userId = req.session.user._id;
    const user=await collection.findById(userId).populate('cart.product')
    await CouponCollection.findOneAndUpdate({ coupon_code: coupon_code }, { $push: { redeemed_users: userId } });
    await collection.findByIdAndUpdate(userId, { $set: { cart: [] } });
    res.render("user/orderPlacedSuccessfully", {isAuthenticated: true,categories,errmessage: "",message: "Order Placed Successfully..!"});
    console.log("cart cleared");
}

let orderId = "";
const OrderSubmit = async (req, res) => {
    console.log("reached OrderSubmit");
    let Discount
    console.log(req.body.cartSubtotal);
    const userId = req.session.user._id;
    const user = await collection.findById(userId).populate('cart.product')
    .populate({
        path: 'cart.product',
        populate: {
            path: 'category',
            model: 'CategoryCollection'
        }
    });
    const cartSubtotal = calculateCartSubtotal(user);
    console.log(cartSubtotal);
    if(discount==''){
        Discount=0
    }else{
        Discount=discount
    }
    
    const cartTotal = calculateCartTotal(user);
    console.log(cartTotal);
    // Create an array of items from the user's cart
    const items = user.cart.map(cartItem => ({
        product_id: cartItem.product._id,
        images:cartItem.product.images,
        sellingprice:cartItem.product.sellingprice,
        quantity: cartItem.quantity,
        sales_price: cartItem.quantity * cartItem.product.sellingprice,
        category_discount: ((cartItem.product.category.discount_percentage/100)*cartItem.product.sellingprice).toFixed(2)
    }));
    const address={
        name:req.body.name,
        address:req.body.address,
        state:req.body.state,
        district:req.body.district,
        city:req.body.city,
        pincode:req.body.pincode,
        mobileno:req.body.mobileno
    } 
    console.log("paymentType=",req.body.paymentType);
    let newOrder
    console.log("coupon discount:",Discount);
    if(Discount==0){
        newOrder = new Orders({
            user_id: userId,
            address,
            items,
            totalAmount: cartTotal,
            actualTotalAmount: cartSubtotal,
            couponDiscount: Discount,
            categoryDiscount,
            finalAmount:(cartSubtotal-categoryDiscount).toFixed(2)
        });
    }else{
        newOrder = new Orders({
            user_id: userId,
            address,
            items,
            totalAmount: cartTotal,
            actualTotalAmount: cartSubtotal,
            couponDiscount: Discount,
            categoryDiscount,
            finalAmount:(cartSubtotal-Discount-categoryDiscount).toFixed(2)
        });
    }
    console.log("newOrder",newOrder);
    if(newOrder.actualTotalAmount==0){
        const response = {
        message: "Something went wrong, go to checkoutpage",
        redirectUrl: `/checkout`
    };
    return res.status(200).json(response);
    }else{
        const cod='COD'
        console.log(cod);
        if(cod==req.body.paymentType){
            console.log(true);
        }else{
            console.log("cod: ",req.body.paymentType);
        }
        const onlinepayment='onlinePayment'
        if(req.body.paymentType==cod) {
            for (const cartItem of user.cart) {
                const product = cartItem.product;
                const orderedQuantity = cartItem.quantity;
                const newStock = product.stock - orderedQuantity;
                if (newStock < 0) {
                    return res.redirect('/checkout?err=true&msg=Insufficient stock for ' + product.name);
                }
                product.stock = newStock;
                await product.save();
            }
            await newOrder.save();
            orderId=newOrder._id
            console.log("newOrder._id:",newOrder._id);
            user.cart = [];
            await user.save();
            return res.json({
                status: "COD",
                redirectUrl: "/placedOrder",
              });
            // const response = {
            //     message: "Order created successfully",
            //     redirectUrl: `/placedOrder`
            // };
            // return res.json({ status: "COD", response: response  });
            // return res.status(200).json(response);
        }else if(req.body.paymentType=='WalletPayment'){
            for (const cartItem of user.cart) {
                const product = cartItem.product;
                const orderedQuantity = cartItem.quantity;
                const newStock = product.stock - orderedQuantity;
                if (newStock < 0) {
                    return res.redirect('/checkout?err=true&msg=Insufficient stock for ' + product.name);
                }
                product.stock = newStock;
                await product.save();
            }
            await newOrder.save();
            orderId=newOrder._id
            console.log("newOrder._id:",newOrder._id);
            user.cart = [];
            await user.save();
            await collection.findByIdAndUpdate(userId,{wallet:user.wallet-newOrder.finalAmount})
            await Orders.findByIdAndUpdate(orderId,{ $set:{payment_status:'paid',payment_method:'wallet payment'}})
            return res.json({
                status: "COD",
                redirectUrl: "/placedOrder",
              });
        }else {
            await newOrder.save();
            const finalAmount=newOrder.finalAmount
            console.log("newOrder.finalAmount:",newOrder.finalAmount);
            orderId=newOrder._id
                userHelper
                  .generateRazorPay(newOrder._id, finalAmount)
                  .then((response) => {
                    console.log("razorpay response is===>", response);
                    return res.json({ status: "RAZORPAY", response: response });
                  });
                // if (cartDetails) {
                //   cartDetails.products = [];
                //   await cartDetails.save();
                // }
              }
        }
        
    }
    
    const verifyOnlinePayment = async (req, res) => {
        let data = req.body;
        console.log(data);
        const userId = req.session.user._id;
        const user = await collection.findById(userId).populate('cart.product');
    for (const cartItem of user.cart) {
        const product = cartItem.product;
        const orderedQuantity = cartItem.quantity;
        const newStock = product.stock - orderedQuantity;
        if (newStock < 0) {
            return res.redirect('/checkout?err=true&msg=Insufficient stock for ' + product.name);
        }
        product.stock = newStock;
        await product.save();
    }
        user.cart = [];
        await user.save();
        let receiptId = data.order.receipt;
        userHelper
          .verifyOnlinePayment(data)
          .then(() => {
            console.log("this is a payment success block");
      
            let paymentSuccess = true;
            userHelper.updatePaymentStatus(receiptId, paymentSuccess).then(() => {
              res.json({ status: "paymentSuccess", placedOrderId: receiptId });
            });
          })
          .catch((err) => {
            console.log("this is a payment failure block");
            console.log("Rejected");
            if (err) {
              console.log(err.message);
      
              let paymentSuccess = false;
              userHelper.updatePaymentStatus(receiptId, paymentSuccess);
            }
          });
      };

      const paymentFailureHandler = async (req, res) => {
        // let data=await Order.findOne({_id:orderId});
        console.log("order details are==>", orderId);
        const userId=req.session.user._id

        let data = await Orders.findOneAndUpdate(
          { _id: orderId }, // Query to find the document
          { $set: { order_status: "payment Failed" } },
          { new: true }
        );
        
        return res.status(200).json({
          redirectUrl: `/paymentFailure`, // Specify the desired redirect URL here
        });
      };
    const paymentFailure = async (req, res) => {
        console.log("reached paymentFailure");
        const categories = await CategoryCollection.find({ blocked: false });
        const orderUpdate = await Orders.findByIdAndUpdate({_id:orderId},{$set:{order_status:'Failed',payment_method:'online payment',payment_status:'failed'}})
        res.render("user/paymentFailure", {isAuthenticated: true,categories,errmessage: "Payment Failed...",message: ""});
      };



const orderDetails=async(req,res)=>{
    console.log("reached orderDetails");
    const orderId=req.params.id
    const orders = await Orders.findById({_id: orderId }).populate('address').populate('items.product_id').populate('user_id');
    const categories = await CategoryCollection.find({ blocked: false });
    res.render("user/orderDetails",{isAuthenticated: true,categories,orders})
}

const cancelOrder=async(req,res)=>{
    console.log("reached cancelOrder");
    const user=await collection.findById(req.session.user._id)
    const orderId=req.params.id
    const orders=await Orders.findById(orderId)
    if(orders.payment_method=='Cash On Delivery'){
        await Orders.findByIdAndUpdate(orderId, { order_status: "cancelled" , payment_status:"cancelled"});
    }else{
        await collection.findByIdAndUpdate(req.session.user._id,{wallet: orders.finalAmount})
        await Orders.findByIdAndUpdate(orderId, { order_status: "cancelled" , payment_status:"refunded"});
    }
    const userId = req.session.user._id;
    const order = await Orders.findById(orderId).populate({
        path: 'items.product_id',
        model: 'productCollection',
    });
    for (const cartItem of order.items) {
        const product = cartItem.product_id;
        const orderedQuantity = cartItem.quantity;
        const newStock = product.stock + orderedQuantity;
        if (newStock < 0) {
            return res.redirect('/checkout?err=true&msg=Insufficient stock for ' + product.name);
        }
        product.stock = newStock;
        await product.save();
    }
    res.redirect(`/orderDetails/${orderId}`);
}

const returnOrder=async(req,res)=>{
    console.log("reached returnOrder");

    const orderId=req.params.id
    const returnReason=req.params.reason
    const orders=await Orders.findById(orderId)
    await collection.findByIdAndUpdate(req.session.user._id,{wallet: orders.finalAmount})
    await Orders.findByIdAndUpdate(orderId, { order_status: "returned",return_Reason:returnReason , payment_status:"refunded"});
    const userId = req.session.user._id;
    const order = await Orders.findById(orderId).populate({
        path: 'items.product_id',
        model: 'productCollection',
    });
    for (const cartItem of order.items) {
        const product = cartItem.product_id;
        const orderedQuantity = cartItem.quantity;
        const newStock = product.stock + orderedQuantity;
        if (newStock < 0) {
            return res.redirect('/checkout?err=true&msg=Insufficient stock for ' + product.name);
        }
        product.stock = newStock;
        await product.save();
    }
    res.redirect(`/orderDetails/${orderId}`);
}

const quantityIncrease=async(req,res)=>{
    console.log("reached quantityIncrease when adding to cart");
    const productId=req.params.id
    const product = await Products.findById(productId);
    const userId = req.session.user._id;
    const user = await collection.findOne({ _id: userId });
    const existingCartItem = user.cart.find(item => item.product.toString() === productId);

    // Update the cart based on whether the product exists or not
    if (existingCartItem) {
        if(product.stock > existingCartItem.quantity){
            existingCartItem.quantity++;
        }else{
            existingCartItem.quantity=existingCartItem.quantity;
        }
    } else {
        if(product.stock===0){
            user.cart.push({
                product: productId,
                quantity: 0
            });
        }else{
            user.cart.push({
                product: productId,
                quantity: 1
            });
        }
    }
    await user.save();
}

const profileEdit=async(req,res)=>{
    console.log("reached profileEdit");
    const username=req.body.name
    const email=req.body.email
    const mobile=req.body.mobile
    const userId=req.session.user._id
    const user=await collection.findByIdAndUpdate(userId,{username:username,email:email,mobile:mobile})
    res.redirect("/myaccount")
}

const changePassword=async(req,res)=>{
    console.log("reached changePassword");
    const categories=await CategoryCollection.find({blocked:false})
    res.render("user/currentPassword",{isAuthenticated: true,categories,errmessage:'',message:''})
}

const validatePassword=async(req,res)=>{
    console.log("reached validatePassword");
    const { password, newpassword, confirmpassword } = req.body;
    const userId=req.session.user._id
    const user=await collection.findById(userId)
    const isMatch = await bcrypt.compare(password, user.password);
    const categories=await CategoryCollection.find({blocked:false})
    if(isMatch){
        const hashedPassword = await bcrypt.hash(newpassword, 10); // You can adjust the salt rounds as needed
        user.password = hashedPassword;
        await user.save();
        res.redirect("/myaccount");
    }else{
        res.render("user/currentPassword",{isAuthenticated: true,categories,errmessage:'Current password is not matching',message:''})
    }
}

module.exports={
    home,login,signup,logout,dosignup,sendOtp,dologin,validateotp,resendotp,Toemail,checkemail,otpchecks,otpcheckpage,
    allpage,showbycategory,ethinicpage,ethinicshowbycategory,westernpage,westernshowbycategory,sportspage,Sportsshowbycategory,
    productview,wishlist,cart,resendOTP_for_forgrtpassword,confirmpassword,confirm_password_check,loadHomeAfterLogin,productQuantityUpdate,
    cartUpdate,doCart,calculateCartSubtotal,calculateCartTotal,placeorder,checkout,cartproductdelete,addAddress,newAddress,editAddress,editedAddress,
    deleteAddress,myaccount,OrderSubmit,placedOrder,orderDetails,cancelOrder,returnOrder,quantityIncrease,profileEdit,changePassword,
    validatePassword,paymentFailure,paymentFailureHandler,verifyOnlinePayment,updateWishlist,wishlistToCart,wishlistProductDelete,
    coupon,applyCoupon,searchProducts,searchProduct
}