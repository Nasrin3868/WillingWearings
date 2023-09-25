// exports.login=async(req,res)=>{
//     res.render("home")
// }

const nodemailer=require("nodemailer")
// const otpgenerator=require("otp-generator")
const randomstring = require('randomstring');



const { collection } = require("../model/mongodb");

const home= async(req,res)=>{
console.log("Reached home");
res.render('user/home')}

const login = async (req, res) => {
    const err = req.query.err;
    const msg = req.query.msg;
    console.log("err "+err);
    console.log("msg "+msg);
    
    if (err === 'true') {
        res.render("user/login", { errmessage : msg, message : "" });
    } else {
        res.render("user/login", { errmessage : "", message : msg });
    }
}

const dologin= async(req,res)=>{
    console.log(req.body.email)
    const data=await collection.findOne({email:req.body.email})
    if(data){
        if(req.body.email===data.email&&req.body.password===data.password){
        req.session.user=data
        res.redirect("/home")
        }else{
            res.redirect(`/login?err=${true}&msg=Password donot match`);
            // res.render("user/login",{message:"credintials are wrong"})
        }
    }else{
        res.redirect(`/login?err=${true}&msg=User not found`);
    }   

}

const signup=async(req,res)=>{
    console.log("reached signup");
    const err=req.query.err
    const msg=req.query.msg
    if(err){
        res.render("user/signup",{errmessage:msg})
    }else{
        res.render("user/signup")
    }
}
let globalEmail=" "

const dosignup = async (req, res) => {
    const data = {
        username: req.body.username,
        email: req.body.email,
        mobile: req.body.mobile,
        password: req.body.password,
        confirmpassword: req.body.confirmpassword
    }
globalEmail=req.body.email
    const check = await collection.findOne({ email: data.email })

    if (check) {
        // res.redirect("signup")
        res.render("user/signup",{errordata:"email already exists"})
    }else {
        await collection.insertOne(data) // Use insertOne for a single document
        res.redirect("otp")
    }

    console.log("Reached signup");
}

// const loadotp=async(req,res)=>{
//     console.log("reached otp");
//     res.render("user/otp")
//     // const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });

// }

let generatedOTP=""


const sendOtp = async (req, res) => {
    console.log("reached otp");
    res.render("user/otp")
    console.log("OTP Send");
    try {
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
          // }
          
       }
       sendOTP();
 
    } catch (error) {
       console.log(error.message);
    }
 }

const validateotp=async(req,res)=>{
console.log("reached validateotp");
    if(generatedOTP===req.body.enterotp){
        
        res.redirect("/home")
    }else{
        res.render("user/otp", { errordata: "Invalid OTP", message: "" })
    }
}

const resendotp=async(req,res)=>{
    res.redirect("/otp")
}

//     // Function to generate a random OTP
//     function generateOTP() {
//     return randomstring.generate({
//         length: 6, // Set the length of your OTP
//         charset: 'numeric', // Use only numeric characters
//     });
//     }

//     // Generate and send OTP
//     const email = 'recipient@example.com'; // Change to the recipient's email address
//     const otp = generateOTP();
//     sendOTP(email, otp);

//     }



module.exports={
    home,login,signup,dosignup,sendOtp,dologin,validateotp,resendotp
}