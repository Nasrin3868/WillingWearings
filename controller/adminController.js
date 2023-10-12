
const multer=require("multer")
const Product=require("../model/productmodel")
const collection=require("../model/mongodb")


const admincollection=require("../model/admincollection")
const CategoryCollection=require("../model/categorymodel")
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
    const categories= await CategoryCollection.find() 
    res.render("admin/addproduct.ejs",{categories})
}

const addproduct = async (req, res) => {
    console.log("reached")
   
      
        const name=req.body.name
        const description=req.body.description
        const price=req.body.price
        const sellingprice=req.body.sellingprice
        const category=req.body.category
        const size=req.body.size
        const brand=req.body.brand
        const stock=req.body.stock
        const status=req.body.status
        const colour=req.body.colour
        const type=req.body.type
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
                console.log(req.session.admin);
                res.redirect("/admin/");
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


const editproduct=async(req,res)=>{
    console.log("reached editproduct");
    const productId=req.params.id
    // const name=req.body.name
    const { name, description, price, sellingprice, category, size, brand, stock,colour,type } = req.body;
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    await Product.findOneAndUpdate({ _id: productId }, { name: name,description:description,price:price,sellingprice:sellingprice,category:category,size:size,brand:brand,stock:stock,colour:colour,type:type});
    res.redirect("/productredirection")

}

const userlist=async(req,res)=>{
    console.log("reached usermanagement");
    const users=await collection.find()
    res.render('admin/userlist',{users})
}

const user_block=async(req,res)=>{
    const userId=req.params.id
    console.log(userId)
    const user= await collection.findById(userId)
    if(user.blocked==true){
        user.blocked=false
    }else{
        user.blocked=true
    }
    await user.save()
    res.redirect('/admin/user_list')
    // await collection.updateOne()
}



const toaddcategory=async(req,res)=>{
    const category=req.body.name
    const categorytype=req.body.category
    const data=await CategoryCollection.findOne({name:category})
    if(data){
        res.render('admin/categorylist',{errmessage:"category already exists"})
    }else{
        const newCategory = new CategoryCollection({ name: category,type: categorytype }); 
        await newCategory.save();
    }
    res.redirect('/admin/categoryredirection')
}

const categoryredirection=async(req,res)=>{
    const categories=await CategoryCollection.find()
    const create=true
    res.render("admin/categorylist.ejs",{categories,errmessage:"",create})
}

const category_block=async(req,res)=>{
    const categoryid=req.params.id
    const category= await CategoryCollection.findById(categoryid)
    if(category.blocked==true){
        category.blocked=false
    }else{
        category.blocked=true
    }
    await category.save()
    res.redirect('/admin/categorylist')
}

const editcategorypage=async(req,res)=>{
    console.log("reached editcategory");
    // const categories=await CategoryCollection.find()
    const name=req.body.name
    const id=req.body.editCategoryId
    const categoryType=req.body.editcategory
    console.log(name);
    console.log(id);
    await CategoryCollection.findOneAndUpdate({ _id: id }, { name: name,type: categoryType });
    res.redirect('/admin/categorylist')
    
}

const  product_block=async(req,res)=>{
    const productId=req.params.id
    console.log(productId)
    const product= await Product.findById(productId)
    console.log(product);
    if(product.blocked==true){
        product.blocked=false
    }else{
        product.blocked=true
    }
    await product.save()
    res.redirect('/admin/product_list')
}

const logout=async(req,res)=>{
    if(req.session.admin){
        req.session.admin=null
        res.redirect('/admin/adminsignin')
    }
}

module.exports={
    dashboard,addproductpage,addproduct,productredirection,signin,dosignin,editproductpage,userlist,user_block,
    toaddcategory,categoryredirection,category_block,editcategorypage,product_block,editproduct,logout
    
}