
const islogin=async(req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect("/")
    }
    
}
const iflogin=async(req,res,next)=>{
    if(req.session.user){
        res.redirect("/home")
    }else{
        next()
    }
}

const islogout=async(req,res,next)=>{
    console.log("logout middleware")
    req.session.user=null;
    next()
}

const cartAuth=async(req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect("/login")
    }
}

module.exports={islogout,islogin,cartAuth,iflogin}