var express=require("express")
const collection=require("../model/mongodb")
const router=express.Router()
const controller=require("../controller/userController")
const middleware=require("../middleware/userAuth")


router.get("/",controller.home)
router.get("/home",controller.home)
router.get("/login",controller.login)
router.post("/login",controller.dologin)
router.get("/logout",middleware.islogout,controller.logout)
// router.post("/logout",controller.dologout)
router.post("/login",controller.home)
router.get("/signup",controller.signup)
router.post("/dosignup",controller.dosignup)
router.get("/otp",controller.sendOtp)
router.post("/otp",controller.sendOtp)
router.post("/validateotp",controller.validateotp)
router.post("/resendOTP",controller.resendotp)
router.get("/forgetpassword",controller.Toemail)
router.post("/emailcheck",controller.checkemail)
router.get("/otpcheck",controller.otpcheckpage)
router.post("/otpcheck",controller.otpchecks)
// router.get("/dosignup",controller.sendotp)
// router.post("/signup")

router.get("/all",controller.allpage)
router.get("/showbycategory/:name",controller.showbycategory)

router.get("/ethinic",controller.ethinicpage)
router.get("/ethinicshowbycategory/:name",controller.ethinicshowbycategory)

router.get("/western",controller.westernpage)
router.get("/westernshowbycategory/:name",controller.westernshowbycategory)

router.get("/sports",controller.sportspage)
router.get("/Sportsshowbycategory/:name",controller.Sportsshowbycategory)

router.get("/productview/:id",controller.productview)

router.get("/wishlist",controller.wishlist)
router.get("/cart",controller.cart)








module.exports=router