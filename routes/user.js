const { response } = require('express');
var express = require('express');
const productHelper = require('../helpers/product-helper');
var router = express.Router();
var userHelper = require('../helpers/user-helper');
const verifyLogin=(req, res, next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
};


/* GET home page. */
router.get('/',async function(req, res, next) {
   let user=req.session.user;
   let cartCount=null
   
   if(user){
   cartCount= await userHelper.getCartCount(req.session.user._id)
     }

    productHelper.getAllProducts().then((products)=>{
    res.render('user/view-product', {products,user,cartCount})
  })
  
});
router.get('/login', function(req, res){
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{"loginErr":req.session.loginErr})
    req.session.loginErr=false
  }
  
});
router.get('/signup', function(res, res){
  res.render('user/signup')
});
router.post('/signup', function(req, res){
  userHelper.doSignup(req.body).then((response)=>{
    console.log(response);
    req.session.loggedIn=true
    req.session.user=response
    res.redirect('/')

  })


});
router.post('/login', function(req, res) {
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.loginErr="Invalid Username or Password"
      res.redirect('/login')
    }
  })

});
router.get('/logout', function(req, res){
  req.session.destroy()
  res.redirect('/')
});
router.get('/cart',verifyLogin,async (req, res)=>{
  let user=req.session.user
  let product=await userHelper.getCartItems(req.session.user._id)
  let cartId=(product)
  
  let total=await userHelper.getTotalPrice(req.session.user._id)
  console.log(total)
  
    res.render('user/cart',{product,user,total}) 
    
});
router.get('/add-to-cart/:id',(req,res)=>{
  
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    
   res.json({status:true})
  })

});
router.get('/delete-from-cart/:id',verifyLogin,(req,res)=>{
  console.log(req.session.user._id);
  console.log(req.params.id);
  userHelper.deleteFromCart(req.params.id,req.session.user._id).then(()=>{
    res.redirect('/cart',)
  })
});
router.post('/change-product-quantity',(req,res,next)=>{
  userId=req.body.user
  console.log(req.body.user)
  userHelper.changeProductQuantity(req.body).then(async(response)=>{
     response.total=await userHelper.getTotalPrice(userId)
    res.json(response)

  })
});
router.get('/checkout',verifyLogin,async(req,res)=>{
  user=req.session.user
  total =await userHelper.getTotalPrice(user._id)
  let shipAdd=await userHelper.getShipAdd(user._id)
  res.render('user/checkout',{user,total,shipAdd})
});
router.post('/order-submission',async(req,res)=>{
  
  let orderDetails=req.body
  console.log(orderDetails)
  let product=await userHelper.getCartItems(orderDetails.user)
   let total =await userHelper.getTotalPrice(orderDetails.user)
  userHelper.addOrder(orderDetails,product,total).then((response)=>{
    console.log(response)
    console.log(response.state)
    if(response.state=='placed'){
      console.log("gfiu")
    res.json(response.placed=true)
    }else{
      console.log("haaaa")
      userHelper.generateRazorpay(response)
      console.log(response+"haii")
      res.json(response)
    }
  })
  


    
});
router.get('/useraddress',verifyLogin,(req,res)=>{
  res.render('user/useraddress',{user})
});
router.post('/shipping-address',(req,res)=>{
  user=req.session.user
  userHelper.shippingAddress(req.body,user._id)
  res.redirect('/checkout',)
});
router.post('/verify-payment',(req,res)=>{
  console.log(req.body)
});
router.get('/order',verifyLogin,(req,res)=>{
  res.render('user/order',{user})
})
router.post('/order',(req,res)=>{
  res.redirect('/order')
})


module.exports = router;
