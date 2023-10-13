const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose'); 

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: true})); 

function connect ( ){
  try{
    mongoose.connect(process.env.url, { useNewUrlParser: true, useUnifiedTopology: true}); 
    console.log("connected"); 
  }
  catch (err){
    console.log(err); 
  }
}
connect(); 
const userSchema = new mongoose.Schema({
  username: String
})
const exerciseSchema = new mongoose.Schema({
  user_id: {type: String}, 
  description: String, 
  duration: Number, 
  date: Date 
}); 
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userModel = mongoose.model("user", userSchema);
const exerciseModel = mongoose.model("exercise", exerciseSchema);

app.post('/api/users', async (req, res) => {  
  const newUser = new userModel({username: req.body.username});
  let result =  await newUser.save(); 
  res.json(result);
})

app.get('/api/users', async (req, res ) => {

  let result =  await userModel.find({});
  // console.log(result);
  res.json(result);
})

app.post('/api/users/:_id/exercises', async (req , res ) => {
  let userId = req.params._id; 
  let user = await userModel.findById(userId);
  
  if(user){
  let date = new Date(req.body.date).toDateString();

  if (date === 'Invalid Date'){
      date  = new Date().toDateString(); 
  }

  let result = await exerciseModel.create({ 
    user_id: userId  ,
    date: date,
    duration: req.body.duration,
    description: req.body.description
  });


  res.json({
    _id: userId, 
    username: user.username, 
    date: date,
    duration : result.duration,
    description: result.description
  }); 
  }
  else{
    console.log("user not found");
    res.json({error: "error"});
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
 let userId = req.params._id;
  console.log(req.query);
try{
  let user = await userModel.findById(userId);
  let exercises = await exerciseModel.find({user_id: userId}).select({description : 1 , duration: 1, date: 1 , _id: 0   });
  
let count =  exercises.length; 

exercises = dateFilter(exercises, req.query.from, req.query.to );
  if(req.query.limit){
    exercises = exercises.slice(0, + req.query.limit);
  }
 let array = exercises.map( item => {
   const date = new Date(item.date).toDateString();
    let newItem = {
        description: item.description , 
        duration: item.duration,
        date: date
    }
   
   return newItem; 
 })



  
  res.json({
    _id: userId,
    username: user.username, 
    count: count, 
    log: array
  }); 

}
  catch(err){
    console.log(err); 
  }

})


const dateFilter = (array , from , to ) => {
let fromDate = new Date(0); 
let toDate = new Date();
if(from){
    fromDate = new Date(from);
  }
if(to){
  toDate = new Date(to)
}
array = array.filter(item => {
  let itemDate = new Date(item.date); 
  return itemDate.getTime() >= fromDate.getTime() && itemDate.getTime() <= toDate.getTime();
})
  console.log(array);
  return array;
}
        
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
