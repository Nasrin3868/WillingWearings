
const multer=require("multer")
const Product=require("../model/productmodel")
const collection=require("../model/mongodb")


const admincollection=require("../model/admincollection")
const path=require("path")


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads'); 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  
  }
});
  
const upload = multer({ storage: storage });



const dashboard=async(req,res)=>{
    console.log("reached admin dashboard");
    res.render("admin/dashboard.ejs")
}

// const productlist=async(req,res)=>{
//     console.log("reached productlist");
//     res.render("admin/product_list.ejs")
// }

const addproductpage=async(req,res)=>{
    console.log("reached addproduct");
    res.render("admin/addproduct.ejs")
}

const addproduct = async (req, res) => {
    console.log("reached")
   
      try {
        const { name, description, price, sellingprice, category, size, brand, stock,status,colour,type } = req.body;
        const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
        console.log('image urls is =>',imageUrls)
        const product = new Product({
          name,
          description,
          price,
          sellingprice,
          category,
          size,
          brand,
          status,
          colour,
          type,
          stock,
          images: imageUrls
        });
        console.log("category id is =>"+category);

        console.log(product.name,product.images)
    
        await product.save();
        console.log("product added")
        const products=await Product.find()
        console.log("products variable added")

        res.redirect("/admin/productredirection")
      } catch (error) {
        console.error("Error uploading product:", error);
        res.status(500).send("Error uploading product.");
      }
    }

const productredirection=async(req,res)=>{
    const products=await Product.find()
    res.render("admin/product_list.ejs",{products})
}
  
const signin=async(req,res)=>{
    console.log("reached signin");
    req.session.admin=null
    res.render("admin/adminsignup",{errmessage:"",message:""})   
}

const dosignin=async(req,res)=>{
    const email=req.body.email
    const password=req.body.password
    console.log(email,password)
    try{
        const data=await admincollection.find({email:email})
        console.log(data);
        if(data.length>0){
            if(data[0].password===password){
                req.session.admin=data[0]._id
                res.render("admin/dashboard");
            }else if(data[0].password!==password){
                res.render("admin/adminsignup",{errmessage:"incorrect password"});
            }
        }else{
            console.log("email error");
            res.render("admin/adminsignup",{errmessage:"incorrect email"});
        }
    }catch(error){
        console.error("Error in dosignin:", error);
        res.status(500).send("Internal Server Error");
    }  
}

const editproductpage=async(req,res)=>{
    console.log("reached toedit");

    const productId=req.params.id
   

    const foundproduct = await Product.findById(productId);

    res.render('admin/editproduct.ejs', { foundproduct });
    // res.render('admin/editproduct')
    // res.redirect("editproduct/id=${productId}")
}

// const doedit=async(req,res)=>{
//     data
// }

const userlist=async(req,res)=>{
    console.log("reached usermanagement");
    const users=await collection.find()
    res.render('admin/userlist',{users})
}

const user_block=async(req,res)=>{
    
}

module.exports={
    dashboard,addproductpage,addproduct,productredirection,signin,dosignin,editproductpage,userlist
}