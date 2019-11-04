//Creating our own middleware
//midleware is just a function

const { User } = require('./../models/user');

let auth = (req,res,next) => {
    let token = req.cookies.w_auth;  

    // grab the token from above and check if token is right
    User.findByToken(token,(err,user)=>{
        if(err) throw err;
        if(!user) return res.json({
            isAuth: false,
            error: true
        });
    //adding token and user to request
        req.token = token;  //entering the request receiving from route & pushing value call token  
        req.user = user;
        next();
    })

}


module.exports = { auth }