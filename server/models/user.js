const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SALT_I = 10;

//CREATE SCHEMA TO PUT MODEL IN

const userSchema = mongoose.Schema({
    email:{
        type:String,
        required: true,
        trim: true,
        unique: 1
    },
    password:{
        type:String,
        required: true,
        minlength: 5
    },
    name:{
        type:String,
        required: true,
        maxlength:100
    },
    lastname:{
        type:String,
        required: true,
        maxlength:100
    },
    cart:{
        type:Array,
        default: []
    },
    history:{
        type:Array,
        default: []
    },
    role:{
        type:Number,
        default:0
    },
    token:{
        type:String
    }
});

userSchema.pre('save',function(next){   //after we save and hash the password we claa next function
    var user = this;

    if(user.isModified('password')){   //isModified is inbuilt mongo function if changing password encrypt else move forward
        bcrypt.genSalt(SALT_I,function(err,salt){  //we generate salt and pass the salt and run funtion to return salt
            if(err) return next(err);              //here next he kill the present function and move to next
      
            bcrypt.hash(user.password,salt,function(err,hash){  //hash the password
                if(err) return next(err);    
                user.password = hash;
                next();
            });
        })
    } else{
        next()
    }
})
  
    //METHOD TO COMPARE PASSWORD

userSchema.methods.comparePassword = function(candidatePassword,callbck){
    //compare the present(candidatepassword)password and password store in database(this.password)
    bcrypt.compare(candidatePassword,this.password,function(err,isMatch){  
        if(err) return callbck(err);  //if err password
        callbck(null,isMatch)   //if password is match
    })
}

userSchema.methods.generateToken = function(callbck){
    var user = this;
    //to generate jwt we use sign. 
    //hOW jwt work => they take user id/password and generate a token(hash). convert to string and pass SECRETPASSWORD
    var token = jwt.sign(user._id.toHexString(),process.env.SECRET)

    user.token = token;  // we store in token what ever we get from jwt 
    user.save(function(err,user){  // save token in user
        if(err) return callbck(err);
        callbck(null,user);
    })
}

userSchema.statics.findByToken = function(token,callbck){
    var user = this;

//grab the token, decode it with jwt and from there we will get user_id and check if token is ok on user
    jwt.verify(token,process.env.SECRET,function(err,decode){
        user.findOne({"_id":decode,"token":token},function(err,user){
            if(err) return callbck(err);
            callbck(null,user);
        })
    })
}





//creating a model out of this userSchema  and model name is User
const User = mongoose.model('User', userSchema) 

module.exports = { User }