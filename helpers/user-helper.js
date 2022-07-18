var db = require('../config/connection');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const e = require('express');
var ObjectID = require('mongodb').ObjectID
const Razorpay = require('razorpay');

var instance = new Razorpay({
  key_id: 'rzp_test_doMzYab1IL4mLl',
  key_secret: 'cpZCALFy9qfyFxfqEXzKAUiz',
});

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10);
            db.get().collection('user').insertOne(userData).then((data)=>{
                 resolve(data.ops[0]);
            });
        });
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection('user').findOne({Email:userData.Email});
            if(user){
                
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        response.user=user
                        response.status=true
                        resolve(response);
                    }else{
                    
                    resolve({status:false});
                    }
                    });
            }else{
                
                resolve({status:false});
            }
        });
    },
    addToCart:(proId,userId)=>{
        let objectIdpro= new ObjectID(proId)
        let proObj={
            Item:objectIdpro,
            Quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let objectIduser= new ObjectID(userId)
            
            let  userCart= await db.get().collection('cart').findOne({user:objectIduser});
            if(userCart){

                let proExist=userCart.productList.findIndex(product=>product.Item==proId)
                
                if(proExist!=-1){

                    db.get().collection('cart').updateOne({'user':objectIduser,'productList.Item':objectIdpro},{
                         $inc:{'productList.$.Quantity':1}
                     }).then((response)=>{
                         resolve()
                     })
                     
                }else{

                    db.get().collection('cart').updateOne({user:objectIduser},
                        {
                        $push:{productList:proObj}
                    }
                    ).then((response)=>{
                        resolve()
                    })
                }

            }else{
                let cartObj={
                    user:objectIduser,
                    productList:[proObj]
                }
                db.get().collection('cart').insertOne(cartObj).then((response)=>{
                    
                    resolve()
                })

            }
        });
    },
    getCartItems:(userId)=>{
        let cartInfo= null
        return new Promise(async(resolve,reject)=>{
            let objectIduser=new ObjectID(userId)
            
            let cartItems=await db.get().collection('cart').aggregate([
                {
                    $match:{user:objectIduser}
                    },
                    {
                        $unwind:"$productList"
                    },
                    {
                        $project:{
                            Item:'$productList.Item',
                            Quantity:'$productList.Quantity',
                            user:'$user'
                        }
                    },
                    {
                        $lookup:{
                            from:"product",
                            localField:"Item",
                            foreignField:"_id",
                            as:"cartInfo"
                        }
                    }
                    
            ]).toArray()
            
            resolve(cartItems)
        });
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let objectIduser= new ObjectID(userId)
            let count=0
            let cart=await db.get().collection('cart').findOne({user:objectIduser})
            if(cart){
                count =cart.productList.length
            }
            resolve(count)
        })
        

    },
    deleteFromCart:(proId,userId)=>{
        return new Promise((resolve,reject)=>{
            
             let objectIdpro=new ObjectID(proId)
             let objectIduser=new ObjectID(userId)
        
            db.get().collection('cart').update({user:objectIduser},
                {
                    $pull:{productList:{ Item:objectIdpro}}
                }).then((response)=>{
                resolve()
            })
        })
    },
    changeProductQuantity:(details)=>{
        let procount=parseInt(details.count)
        let quantity=parseInt(details.quantity)
    
        return new Promise((resolve,reject)=>{
            let objectIdpro=new ObjectID(details.product)
            let objectIdcart=new ObjectID(details.cart)
            if(procount==-1 && quantity==1){
                db.get().collection('cart').update({_id:objectIdcart},
                    {
                        $pull:{productList:{ Item:objectIdpro}}
                    }).then((response)=>{
                        resolve({removeProduct:true})
                    })
            }else{

            db.get().collection('cart').updateOne({_id:objectIdcart,'productList.Item':objectIdpro},
                {
                    $inc:{"productList.$.Quantity": procount}
                }).then((response)=>{
                    resolve({status:true})
                })
            }

        })
    },
    getTotalPrice:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let objectIduser=new ObjectID(userId)
            
            
            
         let cartItems=await db.get().collection('cart').aggregate([
                {
                    $match:{user:objectIduser}
                },
                {
                    $unwind:'$productList'
                },
                {
                     $project:{
                         Item:'$productList.Item',
                         Quantity:'$productList.Quantity'
                     }
                },
                {
                    $lookup:{
                        from:'product',
                        
                        localField:'Item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        Item:1,Quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                
                {
                    $group:{
                        _id:null,
                        
                        total:{$sum:{$multiply:["$Quantity","$product.Price"]}}
                    }
                }
            ]).toArray()
            
            resolve(cartItems[0].total)
        })
    },
    shippingAddress:(userData,userId)=>{
        let objectIduser= new ObjectID(userId)
        let shipObj={
            user:objectIduser,
            name:userData.Name,
            address:userData.Address,
            pincode:userData.Pincode,
            phone:userData.Mobile
        }
        return new Promise(async(resolve,reject)=>{
            let shipExit=await db.get().collection('userSAdd').findOne({user:objectIduser});
            if(shipExit){
                db.get().collection('userSAdd').updateOne({user:objectIduser},{
                    $set:{
                        user:objectIduser,
                        name:userData.Name,
                        address:userData.Address,
                        pincode:userData.Pincode,
                        phone:userData.Mobile
                    }
                }).then((data)=>{
                    resolve(data.ops[0])
                })
            }else{
            db.get().collection('userSAdd').insertOne(shipObj).then((data)=>{
                resolve(data.ops[0])
            })
        }
        })
        
    },
    getShipAdd:(userId)=>{
        let objectIduser=new ObjectID(userId)
        
        
        return new Promise(async(resolve,reject)=>{
            let shipAdd=await db.get().collection('userSAdd').findOne({user:objectIduser})

                resolve(shipAdd)
            
        })
    },
    addOrder:(orderData,product,total)=>{
        console.log(orderData)
        console.log(product[0])

        let proDetails=product[0]
        let paymentmethod=orderData.paymentmethod
        let shipping=orderData.addr
        let userId=orderData.user
        let proId=proDetails.Item
        let quantity=proDetails.Quantity
        let objectIduser=new ObjectID(userId)
        let objectIdpro= new ObjectID(proId)
        let objectIdship=new ObjectID(shipping)
        let status=paymentmethod==='COD'?'placed':'pending'

        let orderObj={
            user:objectIduser,
            shipaddr:objectIdship,
            product:objectIdpro,
            quantity:quantity,
            total:total,
            paymethod:paymentmethod,
            state:status
        }
        return new Promise((resolve,reject)=>{
             db.get().collection('order').insertOne(orderObj).then((order)=>{
                 db.get().collection('cart').updateOne({user:objectIduser},{
                     $pull:{productList:{Item:objectIdpro,Quantity:quantity}}
                 })
                 console.log(order.ops[0])
                    resolve(order.ops[0])
                })
            })
    },
    generateRazorpay:(order)=>{
        let orderId=order._id
        let total =parseInt(order.total)
          return new Promise((resolve,reject)=>{
              let options={
                amount:total,
                currency: "INR",
                receipt:""+orderId
                
              }
        

            instance.orders.create(options, function (err,order) {
                if(err){
                    console.log(err)
                }else{
                    
                
                resolve(order)
                }
            })
            
          })
    },
    verifyPayment:(order)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'cpZCALFy9qfyFxfqEXzKAUiz');
            hmac.update(order['payment[razorpay_order_id]']+"|"+order['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac=order['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePayState:(orderId)=>{
        return new Promise((resolve,reject)=>{
            let objectIdord=new ObjectID(orderId)
            db.get().collection('order').updateOne({_id:objectIdord},{
                $set:{state:'placed'}
            }).then(()=>{
                resolve()
            })
        })
    }
    

}
