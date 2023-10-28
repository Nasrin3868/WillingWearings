
const multer=require("multer")
const easyimg = require('easyimage');
const fs = require('fs');
const Product=require("../model/productmodel")
const collection=require("../model/mongodb")
const Address= require("../model/addressmodel");
const Orders=require("../model/ordermodel")
const sharp = require('sharp');

const admincollection=require("../model/admincollection")
const CategoryCollection=require("../model/categorymodel")
const CouponCollection=require("../model/couponmodel")
const path=require("path");
const { log } = require("sharp/lib/libvips");


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

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // Month is 0-indexed (0 = January, 1 = February, ...)
    const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 1); // Set to the beginning of the current month (midnight on the 1st)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999); 
    
    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const monthlyOrders = await Orders.aggregate([
        {
            $match: {created_on: {$gte: startOfMonth, $lte: endOfMonth},payment_status: { $in: ['paid', 'Pending'] }}
        },
        {
            $group: {_id: null,totalAmount: { $sum: '$actualTotalAmount' }}
        }
    ]);
    const monthlyOrderStats = await Orders.aggregate([
        {
            $match: {
                created_on: {
                    $gte: startOfYear, // Start of the current year
                    $lte: endOfYear  // End of the current year
                }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$created_on" },  // Extract the year from the date
                    month: { $month: "$created_on" } // Extract the month from the date
                },
                count: { $sum: 1 } // Count orders for each month
            }
        },
        {
            $sort: {
                "_id.year": 1, // Sort by year
                "_id.month": 1 // Sort by month
            }
        }
    ]);
    

//     // Extract the calculated values from the aggregation results
    const monthlyOrdersTotal = monthlyOrders.length > 0 ? monthlyOrders.reduce((total, order) => total + order.totalAmount, 0) : 0;
const paidOrdersTotal = paidOrders.length > 0 ? paidOrders[0].totalAmount : 0;

    // Render the dashboard view with the calculated values
    res.render("admin/dashboard.ejs", {
        paidOrdersTotal,
        productCount,
        totalOrdersCount,
        monthlyOrdersTotal,
        monthlyOrderStats
    });
 
}

const addproductpage=async(req,res)=>{
    console.log("reached addproduct");
    const categories= await CategoryCollection.find() 
    res.render("admin/addproduct.ejs",{categories})
}



const addproduct = async (req, res) => {
    console.log("reached");
    console.log(req.body);
    const name = req.body.name;
    const description = req.body.description;
    const price = req.body.price;
    const sellingprice = req.body.sellingprice;
    const categoryname = req.body.category;
    const categories = await CategoryCollection.find({ name: categoryname });
    console.log("category name: ", categoryname);
    console.log("category: ", categories);

    const category = categories[0]._id;

    const size = req.body.size;
    const brand = req.body.brand;
    const stock = req.body.stock;
    const status = req.body.status;
    const colour = req.body.colour;

    let imageUrls = [];
    
    // Define the desired crop dimensions (width, height)
    const width = 700;
    const height = 600;

    // Handle each file individually
    for (const file of req.files) {
        const filePath = path.join('uploads', file.filename);

        // Check if the file exists before processing
        if (fs.existsSync(filePath)) {
            // Use Sharp to resize and crop the image
            const croppedBuffer = await sharp(filePath)
                .resize(width, height)
                .toBuffer();

            // Save the cropped image
            const croppedFilename = 'cropped-' + file.filename;
            const croppedFilePath = path.join('uploads', croppedFilename);
            fs.writeFileSync(croppedFilePath, croppedBuffer);

            imageUrls.push(`/uploads/${croppedFilename}`);
        } else {
            console.log(`File not found: ${filePath}`);
            imageUrls = req.files.map(file => `/uploads/${file.filename}`);
        }
    }

    console.log('image urls are =>', imageUrls);

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
        stock,
        images: imageUrls,
    });

    console.log("category id is =>" + category);
    console.log(product.name, product.images);

    await product.save();
    console.log("product added");
    const products = await Product.find();
    console.log("products variable added");
    res.redirect("/admin/productredirection");
};


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
    const product = await Product.findById(productId).populate('category');
    res.render('admin/editproduct.ejs', { product,categories });
    // res.render('admin/editproduct')
    // res.redirect("editproduct/id=${productId}")
}


const editproduct = async (req, res) => {
    console.log("reached editproduct");
    const productId = req.body.id;
    const name=req.body.name
    const description=req.body.description
    const price=req.body.price
    const sellingprice=req.body.sellingprice
    const categoryname=req.body.category
    const categories= await CategoryCollection.find({name:categoryname}) 
    console.log("category name: ",categoryname);
    console.log("name: ",name);
    console.log("category : ",categories);

    const category=categories[0]._id
    
    const size=req.body.size
    const brand=req.body.brand
    const stock=req.body.stock
    const colour=req.body.colour

    const product = await Product.findById(productId);
    console.log(product);
    console.log(name,description);
    // const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    let imageUrls = product.images;
    if (req.files && req.files.length > 0) {
        let imageUrls = [];
    
    // Define the desired crop dimensions (width, height)
    const width = 700;
    const height = 600;

    // Handle each file individually
    for (const file of req.files) {
        const filePath = path.join('uploads', file.filename);

        // Check if the file exists before processing
        if (fs.existsSync(filePath)) {
            // Use Sharp to resize and crop the image
            const croppedBuffer = await sharp(filePath)
                .resize(width, height)
                .toBuffer();

            // Save the cropped image
            const croppedFilename = 'cropped-' + file.filename;
            const croppedFilePath = path.join('uploads', croppedFilename);
            fs.writeFileSync(croppedFilePath, croppedBuffer);

            imageUrls.push(`/uploads/${croppedFilename}`);
        } else {
            console.log(`File not found: ${filePath}`);
            imageUrls = req.files.map(file => `/uploads/${file.filename}`);
        }
    }
    }
    console.log('image urls is =>',imageUrls)
    if (product) {
        await Product.findOneAndUpdate(
            { _id: productId },
            {
                name,
                description,
                price,
                sellingprice,
                category,
                size,
                brand,
                stock,
                colour,
                images: imageUrls, // Update the image URLs
            }
        );

        res.redirect("/admin/productredirection");
    } else {
        // Handle product not found error
        res.status(404).send("Product not found.");
    }
};


const deleteImage=async(req,res)=>{
    console.log("reached deleteImage");
    const productId=req.params.id
    await Product.findByIdAndUpdate(productId,{$set:{images: []}})
    res.redirect(`/admin/edit-product/${productId}`);
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
    if (data) {
        const categories=await CategoryCollection.find()
        const create=true
        res.render('admin/categorylist', { categories,errmessage: "Category already exists",create });
    } else {
        const newCategory = new CategoryCollection({ name: category, type: categorytype });
        await newCategory.save();
        const categories = await CategoryCollection.find();
        const create = true;
        res.redirect('/admin/categoryredirection')
    }
    // res.redirect('/admin/categoryredirection')
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
    const data=await CategoryCollection.findOne({name:name})
    if (data) {
        const categories=await CategoryCollection.find()
        const create=true
        res.render('admin/categorylist', { categories,errmessage: "Category already exists",create });
    } else {
        await CategoryCollection.findOneAndUpdate({ _id: id }, { name: name,type: categoryType });
        res.redirect('/admin/categorylist')
    }
    
}

const couponlistredirection=async(req,res)=>{
    console.log("reached couponlistredirection");
    const Coupon=await CouponCollection.find()
    const create=true
    res.render("admin/couponlist.ejs",{Coupon,errmessage:"",create})
}

const addcoupon=async(req,res)=>{
    console.log("reached addcoupon");
    const coupon_code=req.body.coupon_code
    const coupon_description=req.body.coupon_description
    const discount_percentage=req.body.coupon_percentage
    const min_order=req.body.min_order
    const max_discount=req.body.max_discount
    const valid_from=req.body.valid_from
    const valid_to=req.body.valid_to
    const data=await CouponCollection.findOne({coupon_code:coupon_code})
    if (data) {
        const Coupon=await CouponCollection.find()
        const create=true
        res.render('admin/couponlist', { Coupon,errmessage: "Coupon already exists",create });
    } else {
        const newCoupon = new CouponCollection({ coupon_code,coupon_description,discount_percentage,min_order,max_discount,valid_from,valid_to });
        await newCoupon.save();
        res.redirect('/admin/couponlist')
    }
}

const updateCoupon=async(req,res)=>{
    console.log("reached updateCoupon");
    
    const couponId=req.body.editCouponId
    const coupon_code=req.body.editcoupon_code
    const coupon_description=req.body.editcoupon_description
    const discount_percentage=req.body.editcoupon_percentage
    const min_order=req.body.editmin_order
    const max_discount=req.body.editmax_discount
    const valid_from=req.body.editvalid_from
    const valid_to=req.body.editvalid_to
    const data=await CouponCollection.findOne({coupon_code:coupon_code})
    // if (data) {
    //     const Coupon=await CouponCollection.find()
    //     const create=true
    //     res.render('admin/couponlist', { Coupon,errmessage: "Coupon already exists",create });
    // } else 
    {
        await CouponCollection.findByIdAndUpdate(couponId,{coupon_code,coupon_description,discount_percentage,min_order,max_discount,valid_from,valid_to})
        res.redirect('/admin/couponlist')
    }
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
        }else{
            const order=await Orders.findByIdAndUpdate(orderId, { order_status: status });
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

const dailyOrder = async (req, res) => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 1);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999); 
    const orders = await Orders.find({created_on: { $gte: startOfDay, $lte: endOfDay }}).populate('address').populate('items.product_id').populate('user_id');
    res.render('admin/salesReport.ejs', { orders });
};

const weeklyOrder = async (req, res) => {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 1);
    const endOfWeek = new Date(now);
    // Set the end of the week to Sunday (end of the day)
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const orders = await Orders.find({created_on: { $gte: startOfWeek, $lte: endOfWeek }}).populate('address').populate('items.product_id').populate('user_id');
    res.render('admin/salesReport.ejs', { orders });
};

const yearlyOrder = async (req, res) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    const orders = await Orders.find({created_on: { $gte: startOfYear, $lte: endOfYear }}).populate('address').populate('items.product_id').populate('user_id');
    res.render('admin/salesReport.ejs', { orders });
};





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
    changestatus,removeImage,salesReport,dailyOrder,weeklyOrder,yearlyOrder,deleteImage,couponlistredirection,addcoupon,updateCoupon
    
}