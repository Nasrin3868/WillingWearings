
const islogin=async(req,res,next)=>{
    if(!req.session.admin){
        res.redirect("/admin/adminsignin")
    }else{
        next()        
    }
    
}


const isloggedin = (req, res, next) => {
    // Check if the user is authenticated (e.g., by checking the session or token)
    if (req.session.admin) {
      // If authenticated, redirect to the dashboard page
      return res.redirect('/admin/signin');
    }
    // If not authenticated, allow the request to continue to the next middleware/route
    next();
  };

const islogout=async(req,res,next)=>{
    console.log("logout middleware")
    if(!req.session.admin){
    next()
    }else{
        res.redirect("/admin")
    } 
}

module.exports={islogout,islogin,isloggedin}