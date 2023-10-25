
const multer=require("multer")
const Product=require("../model/productmodel")
const collection=require("../model/mongodb")
const Address= require("../model/addressmodel");
const Orders=require("../model/ordermodel")


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
    const productCount=await Product.countDocuments();
    const orders = await Orders.find().populate('address').populate('items.product_id').populate('user_id');
    const paidOrders = await Orders.aggregate([
        {
            $match: {payment_status: { $in: ['paid', 'Pending'] }}
        },
        {
            $group: { _id: null,totalAmount: { $sum: '$actualTotalAmount' }}
        }
    ]);
    console.log(paidOrders);
    // Calculate the total no. of orders in the collection
    const totalOrdersCount = await Orders.countDocuments();

    // Calculate the sum of actualTotalAmount for orders in the current month
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const days= 1
    const year = now.getFullYear().toString();
    const currentDate = `${day}-${month}-${year}`;
    const firstDayOfMonth = `${days}-${month}-${year}`;

    const monthlyOrders = await Orders.aggregate([
        {
            $match: {created_on: {$gte: firstDayOfMonth,$lte: currentDate},payment_status: { $in: ['paid', 'Pending'] }}
        },
        {
            $group: {_id: null,totalAmount: { $sum: '$actualTotalAmount' }}
        }
    ]);
    const monthlyOrderStats = await Orders.aggregate([
        {
            $match: {
                created_on: {
                    $gte: `01-01-${year}`, // Start of the current year
                    $lte: `31-12-${year}`  // End of the current year
                }
            }
        },
        {
            $group: {
                _id: { $substr: ["$created_on", 3, 2] }, // Extract month from the date
                count: { $sum: 1 } // Count orders for each month
            }
        },
        {
            $sort: {
                "_id": 1 // Sort by month
            }
        }
    ]);
    

    // Extract the calculated values from the aggregation results
    const paidOrdersTotal = paidOrders.length > 0 ? paidOrders[0].totalAmount : 0;
    const monthlyOrdersTotal = monthlyOrders.length > 0 ? monthlyOrders[0].totalAmount : 0;

    // Render the dashboard view with the calculated values
    res.render("admin/dashboard.ejs", {
        paidOrdersTotal,
        productCount,
        totalOrdersCount,
        monthlyOrdersTotal,
        monthlyOrderStats
    });
    // res.render("admin/dashboard.ejs")
 
}

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
   

    const categories= await CategoryCollection.find() 
    const product = await Product.findById(productId);

    res.render('admin/editproduct.ejs', { product,categories });
    // res.render('admin/editproduct')
    // res.redirect("editproduct/id=${productId}")
}


const editproduct=async(req,res)=>{
    console.log("reached editproduct");
    const productId=req.params.id
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

const orderManagement=async(req,res)=>{
    console.log("reached orderManagement");
    const orders = await Orders.find().populate('address').populate('items.product_id').populate('user_id');
    res.render('admin/orderManagement',{orders})
}

const orderDetails=async(req,res)=>{
    console.log("reached orderDetails");
    const orderId=req.params.id
    const orders = await Orders.findById(orderId).populate('address').populate('items.product_id').populate('user_id');
    res.render('admin/orderDetails',{orders})
}

const changestatus = async (req, res) => {
    try {
        const status = req.params.status;
        const orderId = req.params.id;
        if(status=='delivered'){
            const order=await Orders.findByIdAndUpdate(orderId, { order_status: status , payment_status: 'paid'});
        }else if(status=='cancel(seller)_defect'||status=="cancel(seller)_incorrect address"){
            const orders = await Orders.findById(orderId).populate({
                path: 'items.product_id',
                model: 'productCollection',
            });
            if(orders.payment_method=='Cash On Delivery'){
                await Orders.findByIdAndUpdate(orderId, { order_status: status , payment_status:"cancelled"});
            }else{
                await Orders.findByIdAndUpdate(orderId, { order_status: status , payment_status:"refunded"});
            }
            for (const cartItem of orders.items) {
                const product = cartItem.product_id;
                const orderedQuantity = cartItem.quantity;
                const newStock = product.stock + orderedQuantity;
                if (newStock < 0) {
                    return res.redirect('/checkout?err=true&msg=Insufficient stock for ' + product.name);
                }
                product.stock = newStock;
                await product.save();
            }
        }
        res.redirect(`/admin/orderDetails/${orderId}`);
    } catch (error) {
        console.error(error);
    }
};

const salesReport=async(req,res)=>{
  console.log("reached salesReport");
  const orders = await Orders.find().populate('address').populate('items.product_id').populate('user_id');
  res.render('admin/salesReport.ejs',{orders})
}

const dailyOrder=async(req,res)=>{
    console.log("reached dailyOrder");
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString();
    const currentDate = `${day}-${month}-${year}`;
    const orders = await Orders.find({ created_on: currentDate }).populate('address').populate('items.product_id').populate('user_id');
    console.log(orders);
    res.render('admin/salesReport.ejs',{orders})
}

const weeklyOrder=async(req,res)=>{
    console.log("reached weeklyOrder");
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString();
    const currentDate = `${day}-${month}-${year}`;

    const days = now.getDate() -7;
    const months = (now.getMonth() + 1).toString().padStart(2, '0');
    const years = now.getFullYear().toString();
    const sevenDaysBefore = `${days}-${months}-${years}`;
    const orders = await Orders.find({ created_on: {$gt: sevenDaysBefore, $lte: currentDate } }).populate('address').populate('items.product_id').populate('user_id');
    res.render('admin/salesReport.ejs',{orders})
}

const yearlyOrder = async (req, res) => {
    console.log("reached yearlyOrder");
    const now = new Date();
    const year = now.getFullYear().toString();
    const orders = await Orders.find({ created_on: { $regex: year } }).populate('address').populate('items.product_id').populate('user_id');
    res.render('admin/salesReport.ejs', { orders });
}




const removeImage = async (req, res) => {
    const { productId, imageFile, dataindex } = req.body;
  
    // Make sure to validate input and handle errors properly here
  
    try {
      // Remove the image URL from the product's images array
      await Product.updateOne(
        { _id: productId },
        { $pull: { images: imageFile } }
      );
  
      // Delete the image file from the file system
      // Assuming you store images in a directory named 'public/uploads'
      const imagePath = path.join("public/uploads", path.basename(imageFile));
  
      // Code to delete the image file (implement error handling as needed)
      // fs.unlinkSync(imagePath);
  
      return res.json({ message: "Image removed successfully" });
    } catch (error) {
      console.error("Error occurred during image removal:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  
  


module.exports={
    dashboard,addproductpage,addproduct,productredirection,signin,dosignin,editproductpage,userlist,user_block,
    toaddcategory,categoryredirection,category_block,editcategorypage,product_block,editproduct,logout,orderManagement,orderDetails,
    changestatus,removeImage,salesReport,dailyOrder,weeklyOrder,yearlyOrder
    
}