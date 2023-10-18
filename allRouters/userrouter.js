var express=require("express")
const collection=require("../model/mongodb")
const router=express.Router()
const controller=require("../controller/userController")
const middleware=require("../middleware/userAuth")


router.get("/",controller.home)
router.get("/home",middleware.islogin,controller.loadHomeAfterLogin)
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
router.post("/resendOTP_for_forgrtpassword",controller.resendOTP_for_forgrtpassword)
router.get("/confirmpassword",controller.confirmpassword)
router.post("/confirm_password_check",controller.confirm_password_check)
// router.post("/signup")

router.get("/all",controller.allpage)
router.get("/showbycategory/:name",controller.showbycategory)

router.get("/ethinic",controller.ethinicpage)
router.get("/ethinicshowbycategory/:name",controller.ethinicshowbycategory)

router.get("/western",controller.westernpage)
router.get("/westernshowbycategory/:name",controller.westernshowbycategory)
// router.get("/westernShowByPrice",controller.westernShowByPrice)
router.get("/sortByPrice/:category/:price",controller.sortByPrice)

router.get("/sports",controller.sportspage)
router.get("/Sportsshowbycategory/:name",controller.Sportsshowbycategory)

router.get("/productview/:id",controller.productview)

router.get("/wishlist",middleware.cartAuth,controller.wishlist)
router.post("/productQuantityUpdate",controller.productQuantityUpdate)
router.get("/doCart/:id",middleware.cartAuth,controller.doCart)
router.get("/cart",middleware.cartAuth,controller.cart)
router.post("/cartUpdate",controller.cartUpdate)
router.get("/cart",middleware.cartAuth,controller.calculateCartSubtotal)
router.get("/placeorder/:total",middleware.cartAuth,controller.placeorder)

router.get("/checkout",middleware.cartAuth,controller.checkout)
router.get("/cartproductdelete/:id",middleware.cartAuth,controller.cartproductdelete)

router.get("/addAddress",middleware.cartAuth,controller.addAddress)
router.post("/newAddress",controller.newAddress)
router.get("/editAddress/:id",middleware.cartAuth,controller.editAddress)
router.post("/editedAddress/:id",middleware.cartAuth,controller.editedAddress)
router.get("/deleteAddress/:id",middleware.cartAuth,controller.deleteAddress)

router.get("/myaccount",middleware.cartAuth,controller.myaccount)
router.post("/OrderSubmit",controller.OrderSubmit)
router.get("/placedOrder/:id",middleware.cartAuth,controller.placedOrder)
router.get("/orderDetails/:id",middleware.cartAuth,controller.orderDetails)
router.post("/cancelOrder/:id",controller.cancelOrder)
router.post("/returnOrder/:id",controller.returnOrder)

// router.post("/cartTotalUpdate",controller.cartTotalUpdate)

// router.post("/cartUpdate",controller.calculateCartSubtotal)
router.post("/quantityIncrease/:id",middleware.cartAuth,controller.quantityIncrease)

router.post("/profileEdit",controller.profileEdit)

module.exports=router