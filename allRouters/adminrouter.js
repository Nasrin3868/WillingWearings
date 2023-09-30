var express=require("express")
const admincollection=require("../model/mongodb")
const collection=require("../model/mongodb")

const router=express.Router()
const controller=require("../controller/adminController")
const path=require("path")

// const middleware=require("../middleware/userAuth")
const multer=require("multer")
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads'); 
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));  
    }
  });
    
  const upload = multer({ storage: storage });
  

router.get("/",controller.dashboard)
router.get("/addproduct",controller.addproductpage)
router.post("/addproduct", upload.array('images', 4),controller.addproduct)
router.get("/productredirection",controller.productredirection)
router.get("/product_list",controller.productredirection)
router.get("/adminsignin",controller.signin)
router.post("/adminsignin",controller.dosignin)
router.get("/edit-product/:id",controller.editproductpage)
// router.post("/editproduct",controller.doedit)
// router.post("/edit-product/:id",controller.editonaddproduct)

router.get("/user_list",controller.userlist)
router.post("/userblock",controller.user_block)



module.exports=router