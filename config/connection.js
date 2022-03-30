const MongoClient = require('mongodb');
const url='mongodb://localhost:27017';
const dbname="shopping";
const state={
    db:null
}
MongoClient.connect(url, (err,data)=>{
    if(!err){
        console.log("database coonected");
        state.db=data.db(dbname)
    }
        else
        console.log("error");
    
});
/*module.exports.connect =function(done) {
    const url ="mongodb://localhost:27017"
    const dbname="shopping"

    MongoClient.connect(url,(err,data)=>{
        if(err) {return done(err)}
        state.db=data.db(dbname)
        done()
    })
    
};*/

module.exports.get=function(){
    return state.db
};