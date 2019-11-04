const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");


const app = express();
const mongoose = require("mongoose");
require("dotenv").config();   //dotenv grabs the DATABASE and mkaes it available to use it right here


mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE,{ useNewUrlParser: true, useUnifiedTopology: true ,useCreateIndex: true }); 


//================================================
//Register middleware to use bodyParser and cookieParser
//================================================
app.use(bodyParser.urlencoded({extended:true}));    //use  url query string
app.use(bodyParser.json())           //we use json so that when ever we get request we will be able to read it
app.use(cookieParser())


// MODELS
const { User } = require('./models/user') //to store anything we can make a reference to this  { User}
const { Brand } = require('./models/brand');
const { Wood } = require('./models/wood');
const { Product } = require('./models/product')


// Middlewares
const { auth } = require('./middleware/auth');
const { admin } = require('./middleware/admin') 



//=================================
//             PRODUCTS
//=================================


// BY ARRIVAL
// /articles?sortBy=createdAt&order=desc&limit=4

// BY SELL
// /articles?sortBy=sold&order=desc&limit=100
app.get('/api/product/articles',(req,res)=>{

    let order = req.query.order ? req.query.order : 'asc';  
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
    let limit = req.query.limit ? parseInt(req.query.limit) : 100; //so that limit would be in numeric

    Product.
    find().
    populate('brand').
    populate('wood').
    sort([[sortBy,order]]).  //pass sortBy and set by order
    limit(limit).             //specify limit
    exec((err,articles)=>{    //and execute
        if(err) return res.status(400).send(err);
        res.send(articles)
    })
})

/// /api/product/article?id=HSHSHSKSK,JSJSJSJS,SDSDHHSHDS,JSJJSDJ&type=single
app.get('/api/product/articles_by_id',(req,res)=>{
    let type = req.query.type;                     //query comes from urlencoded
    let items = req.query.id;

    if(type === "array"){
        let ids = req.query.id.split(',');
        items = [];
        items = ids.map(item=>{
            return mongoose.Types.ObjectId(item)
        })
    }

    Product.
    find({ '_id':{$in:items}}).  //finding product single or by id and exexcute and send back to doc
    populate('brand').
    populate('wood').
    exec((err,docs)=>{
        return res.status(200).send(docs)
    })
});


app.post('/api/product/article',auth,admin,(req,res)=>{
    const product = new Product(req.body);             // comes from body parser

    product.save((err,doc)=>{
        if(err) return res.json({success:false,err});
        res.status(200).json({
            success: true,
            article: doc
        })
    })
})

//=================================
//              WOODS
//=================================

app.post('/api/product/wood',auth,admin,(req,res)=>{
    //middleware here is converting what we get on the body from the json and getting back to us
    const wood = new Wood(req.body); 

    wood.save((err,doc)=>{
        if(err) return res.json({success:false,err});
        res.status(200).json({
            success: true,
            wood: doc
        })
    })
});

app.get('/api/product/woods',(req,res)=>{
    Wood.find({},(err,woods)=>{            //enter wood model and find everything
        if(err) return res.status(400).send(err);
        res.status(200).send(woods)
    })
})


//=================================
//              BRAND
//=================================

app.post('/api/product/brand',auth,admin,(req,res)=>{
    const brand = new Brand(req.body);

    brand.save((err,doc)=>{
        if(err) return res.json({success:false,err});
        res.status(200).json({
            success:true,
            brand: doc
        })
    })
})

app.get('/api/product/brands',(req,res)=>{
    Brand.find({},(err,brands)=>{
        if(err) return res.status(400).send(err);
        res.status(200).send(brands)
    })
})

//========================================
//           USERS
//========================================

app.get('/api/users/auth',auth,(req,res)=>{

    //if auth is ok we  enter and send json response
    res.status(200).json({
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        cart: req.user.cart,
        history: req.user.history
    })
})

app.post('/api/users/register', (req,res) =>{
    const user = new User(req.body);   //middleware here is converting what we get on ths body from the json and getting back to us

    user.save((err,doc) =>{
        if(err) return res.json({success:false, err})
        res.status(200).json({
            success:true,
        })
    })
})

   app.post('/api/users/login',(req,res)=>{
//find the email
    User.findOne({'email':req.body.email},(err,user)=>{
        if(!user) return res.json({loginSuccess:false,message:'Auth failed, email not found'});
//if application finds the user it will check the password
        user.comparePassword(req.body.password,(err,isMatch)=>{
            if(!isMatch) return res.json({loginSuccess:false,message:'Wrong password'});
//generate a token
            user.generateToken((err,user)=>{
                if(err) return res.status(400).send(err);
                 //if evrything goes right we store token in cookie, (w_auth=name , and value)
                res.cookie('w_auth',user.token).status(200).json({
                    loginSuccess: true
                })
            })
        })
    })
})

app.get('/api/users/logout',auth,(req,res)=>{
    User.findOneAndUpdate(
        { _id:req.user._id }, //find by _id
        { token: '' },   //enter the token and delete it 
        (err,doc)=>{
            if(err) return res.json({success:false,err});
            return res.status(200).send({
                success: true
            })
        }
    )
});




const port = process.env.PORT || 3002;

app.listen(port, () =>{
     console.log(`Server is running  at ${port}`)
})