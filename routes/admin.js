var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helper');

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllProducts().then((products)=>{
    res.render('admin/view-product', {admin: true, products});
  });
  
});
router.get('/add-product', function(req,res) {
  res.render('admin/add-product', {admin: true});
});
router.post('/add-product',(req, res)=>{
  console.log(req.body);
  console.log(req.files.Image);

  productHelper.addProduct(req.body,(id)=>{
    let image=req.files.Image
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
      res.render("admin/add-product", {admin: true});
      }
      else{console.log("error"+err)}
    });
    
  });
});
router.get('/view-order',(req, res)=>{
  res.render('admin/view-order', {admin: true});

});
router.get('/view-user',(req, res)=>{
  res.render('admin/view-user',{admin: true});

});
router.get('/edit-product/:id',async(req, res)=>{
    let product=await productHelper.getProductDetails(req.params.id);
    res.render('admin/edit-product',{admin: true, product});
});
router.post('/edit-product/:id',(req, res)=>{
    
     productHelper.updateProduct(req.params.id,req.body).then(()=>{
      let image =req.files.Image
      let id = req.params.id
      
       res.redirect('/admin')
       image.mv('./public/product-images/'+id+'.jpg');
     })
     
});
router.get('/delete-product/:id',(req, res)=>{
  let proId=req.params.id
  productHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin')
  })

});




module.exports = router;
