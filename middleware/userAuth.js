
const islogin=async(req,res,next)=>{
    if(req.sesion.user){
        next()
    }else{
        res.redirect("/home")
    }
    
}


const islogout=async(req,res,next)=>{
    console.log("logout middleware")
    req.session.user=null;
    // console.log( req.sesion.user)
    next()
}

module.exports={islogout,islogin}