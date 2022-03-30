var db = require('../config/connection');
var collection = require('../config/collections');
var ObjectID = require('mongodb').ObjectID
module.exports={

    addProduct:(product,callback)=>{
        let Name=product.Name
        let Category=product.Category
        let Description=product.Description
        let Price=parseInt(product.Price)
        let proObj={
            Name:Name,
            Category:Category,
            Description:Description,
            Price:parseFloat(Price)
        }

        db.get().collection('product').insertOne(proObj).then((data)=>{
            console.log(data);
            callback(data.ops[0]._id);
        });
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection('product').find().toArray();
            resolve(products);
        });
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
         let objectId = new ObjectID(proId);
        db.get().collection('product').removeOne({_id:objectId}).then((response)=>{
            resolve(response)
        })
        });
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve, reject)=>{
            let objectId = new ObjectID(proId); 
            db.get().collection('product').findOne({_id:objectId}).then((product)=>{
               resolve(product)
            })
        });
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{

            let objectId = new ObjectID(proId);
            db.get().collection('product').updateOne({_id:objectId},{
                $set:{
                    Name:proDetails.Name,
                    Category:proDetails.Category,
                    Description:proDetails.Description,
                    Price:proDetails.Price
                }
            }).then((response)=>{
                resolve()
            })
        });
    }
};