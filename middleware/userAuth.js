
const islogin=async(req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect("/")
    }
    
}


const islogout=async(req,res,next)=>{
    console.log("logout middleware")
    req.session.user=null;
    // console.log( req.sesion.user)
    next()
}

const cartAuth=async(req,res,next)=>{
    if(req.session.user){
        next()
    }else{
        res.redirect("/login")
    }
}

module.exports={islogout,islogin,cartAuth}