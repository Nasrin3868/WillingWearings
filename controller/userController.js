const bcrypt=require("bcrypt")
const nodemailer=require("nodemailer")
// const otpgenerator=require("otp-generator")
const randomstring = require('randomstring');



const { collection } = require("../model/mongodb");

const home= async(req,res)=>{
    console.log("Reached home");
    if(req.session.user){
        const isAuthenticated=true
        res.render("user/home",{isAuthenticated})
    }else{
        const isAuthenticated=false
        res.render("user/home",{isAuthenticated})   
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


//authentication

// const signup=async(req,res)=>{
//     console.log("reached signup");
//     if(req.session.user){
//         const isAuthenticated=true
//         const err=req.query.err
//         const msg=req.query.msg
//         if(err){
//             res.render("user/signup",{errmessage:msg,isAuthenticated})
//         }else{
//             res.render("user/signup",{isAuthenticated})
//         }
//     }else{
//         const isAuthenticated=true
//         const err=req.query.err
//         const msg=req.query.msg
//         if(err){
//             res.render("user/signup",{errmessage:msg,isAuthenticated})
//         }else{
//             res.render("user/signup",{isAuthenticated})
//         }

//     }
// }



const dosignup = async (req, res) => {
    const data = {
        username: req.body.username,
        email: req.body.email,
        mobile: req.body.mobile,
        password: req.body.password,
    }
    globalEmail=req.body.email
    const check = await collection.findOne({ email: data.email })

    if (check) {
        res.render("user/signup",{errordata:"email already exists"})
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





module.exports={
    home,login,signup,logout,dosignup,sendOtp,dologin,validateotp,resendotp,Toemail,checkemail,otpchecks,otpcheckpage
}