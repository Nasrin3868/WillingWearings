const bcrypt=require("bcrypt")
const nodemailer=require("nodemailer")
// const otpgenerator=require("otp-generator")
const randomstring = require('randomstring');
const collection = require("../model/mongodb");
const Products=require("../model/productmodel")
const CategoryCollection=require("../model/categorymodel")

const home=async(req,res)=>{
    const isAuthenticated=false
    const categories=await CategoryCollection.find({blocked:false})
    const products=await Products.find({blocked:false})
    console.log(products);
    res.render("user/home",{isAuthenticated,products,categories})
}

const loadHomeAfterLogin= async(req,res)=>{
    console.log("Reached home");
    const userId = req.query.userId;
    if (req.session.user) {
        const isAuthenticated = true;
        const categories = await CategoryCollection.find({ blocked: false });
        const products = await Products.find({ blocked: false });
        res.render("user/home", { isAuthenticated, products, categories});
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

// var loginwithoutotp=''
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
    const data = {
        username: req.body.username,
        email: req.body.email,
        mobile: req.body.mobile,
        password: req.body.password,
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
                const newUser = new collection(data); // Create a new instance of the model

        try {
          await newUser.save(); // Save the new user to the database
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
console.log("reached......=>")
    if(generatedOTP===req.body.enterotp){
        // Save OTP to MongoDB
        const email=globalEmail
        const save_otp=generatedOTP
        const isAuthenticated=true
        const categories=await CategoryCollection.find({blocked:false})
        const products=await Products.find({blocked:false})
        await collection.updateOne({email},{$set:{otp:save_otp}})
        res.redirect('/home');
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

const allpage=async(req,res)=>{
    console.log("reached all wears");
    
    if(req.session.user){
        const isAuthenticated=true
        const categories=await CategoryCollection.find({blocked:false})
        const products=await Products.find({blocked:false})
        const user=req.session.user
        res.render("user/all",{isAuthenticated,products,categories,user})
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
        const isAuthenticated=true
        const categories=await CategoryCollection.find({blocked:false})
        res.render("user/wishlist",{isAuthenticated,categories})
    
}



const doCart = async (req, res) => {
    // Extract the product ID from the route parameter
    const productId = req.params.id;
    const id=req.params.id 
    const categories=await CategoryCollection.find({blocked:false})
    const product = await collection.findOne({_id:id});
    const userId = req.session.user._id;
    const user = await collection.findOne({ _id: userId });
    const existingCartItem = user.cart.find(item => item.product.toString() === productId);

    // Update the cart based on whether the product exists or not
    if (existingCartItem) {
        // If the product exists in the cart, increment the quantity
        existingCartItem.quantity++;
    } else {
        // If the product doesn't exist, add it to the cart with quantity 1
        user.cart.push({
            product: productId,
            quantity: 1
        });
    }
    await user.save();
    const userdata=await collection.findById(userId).populate('cart.product')
    // res.redirect("/cart")
};

const productQuantityUpdate=async (req,res)=>{
    console.log("reached productQuantityUpdate");
   
    const userId = req.session.user._id;
    const cartItem = req.body;
    console.log(cartItem)
    const user = await collection.findOne({ _id: userId });
    const CartItem = user.cart.find(item => item.product.toString() === cartItem);
    CartItem.quantity = quantity;
      console.log(CartItem);
      await user.save();
}

const cartUpdate = async (req, res) => {
    console.log("reached cartupdate");
    try {
      const userId = req.session.user._id;
      const { productid, quantity, total } = req.body;
      const user = await collection.findOne({ _id: userId });
      const CartItem = user.cart.find(item => item.product.toString() === productid);
      CartItem.quantity = quantity;
      console.log(CartItem);
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

const cart = async (req, res) => {
    console.log("Reached cart");
    const userId = req.session.user._id;
    const user = await collection.findById(userId).populate('cart.product');
    const categories = await CategoryCollection.find({ blocked: false });

    // Calculate the cart subtotal using the defined function
    const cartSubtotal = calculateCartSubtotal(user);
    console.log(cartSubtotal);
    res.render("user/cart", {isAuthenticated: true,
        categories,
        userdata: user,
        cartSubtotal: cartSubtotal, // Pass the cart subtotal to the template
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

const placeorder = async (req, res) => {
    const userId = req.session.user._id;
    const user = await collection.findById(userId).populate('cart.product');
    const categories = await CategoryCollection.find({ blocked: false });

    // Calculate the cart subtotal using the defined function
    const cartSubtotal = calculateCartSubtotal(user);

    // Pass the cart subtotal to the template
    res.render("user/placeorder", {
        isAuthenticated: true,
        categories,
        total: cartSubtotal, // Pass the cart subtotal as 'total' to the template
    });
}

const checkout=async(req,res)=>{
    console.log("reached checkout page");
    const userId = req.session.user._id;
    const user = await collection.findById(userId).populate('cart.product');
    const categories = await CategoryCollection.find({ blocked: false });
    const cartSubtotal = calculateCartSubtotal(user);
    res.render("user/checkout",{isAuthenticated:true,categories,user,cartSubtotal})
}
  
const addAddress=async(req,res)=>{
    console.log("reached addAddress");
    const categories = await CategoryCollection.find({ blocked: false });
    res.render("user/addAddress",{isAuthenticated:true,categories})
}



module.exports={
    home,login,signup,logout,dosignup,sendOtp,dologin,validateotp,resendotp,Toemail,checkemail,otpchecks,otpcheckpage,
    allpage,showbycategory,ethinicpage,ethinicshowbycategory,westernpage,westernshowbycategory,sportspage,Sportsshowbycategory,
    productview,wishlist,cart,resendOTP_for_forgrtpassword,confirmpassword,confirm_password_check,loadHomeAfterLogin,productQuantityUpdate,
    cartUpdate,doCart,calculateCartSubtotal,placeorder,checkout,cartproductdelete,addAddress
}