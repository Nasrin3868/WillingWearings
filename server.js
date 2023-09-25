const express=require("express");
const app=express();
const bodyparser=require("body-parser")
const userrouter=require("./allRouters/userrouter")
const path=require("path")
const bcrypt=require("bcrypt")
const nodemailer=require("nodemailer")
// const otpgenerator=require("otp-generator")
const randomstring = require('randomstring');
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");


const static=path.join(__dirname+"/public")
app.set("views",__dirname+"/views")

app.use(express.static(static))
app.use(
    session({
      secret: uuidv4(),
      resave: false,
      saveUninitialized: false,
    })
  );



const port=6868


app.set("view engine","ejs")
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use("/",userrouter)

app.listen(port,()=>{
    console.log(`http://localhost:${port}`);
});