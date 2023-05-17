const mongoose=require("mongoose")
const cors=require("cors")
const bcrypt = require("bcryptjs")
const express = require("express")
const user = require("./database/model/user.model")
const PORT = process.env.PORT || 8000
const jwt = require("jsonwebtoken")
const Admin = require("./database/model/admin.model")
const ParkingBuilding = require("./database/model/parkingBuilding.model")

mongoose.connect("mongodb+srv://lee:aUB9yJ4qxMDmjqnu@cluster-sunpark.ipsvmza.mongodb.net/test")

const app=express()
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(cors())

const insertDefaultData = async () => { 
  const defaultParkingBuilding =[
  {
      name:"Sunway University Parking",
    address:"Bandar Sunway, 47500 Petaling Jaya, Selangor",
    capacity:10,
    availableSpace:10
  },
  {
    name:"Sunway Pyramid",
    address:"3, Jalan PJS 11/15, Bandar Sunway, 47500 Petaling Jaya, Selangor",
    capacity:10000,
    availableSpace:10000
  },
  {
    name:"Monash Western Car Park",
    address:"Ss 13, 47500 Subang Jaya, Selangor",
    capacity:300,
    availableSpace:300
  },

];
await ParkingBuilding.create(defaultParkingBuilding);
}


async function hashPassword(password){
  const res =  await bcrypt.hash(password,10);
  return res
}

async function comparePassword(userPassword,hashPassword){
  const res = await bcrypt.compare(userPassword,hashPassword);
  return res
}

app.get("/",cors(), (req,res) =>{
  res.send("hello from backend")
  insertDefaultData();
})

app.get("/carparkbuilding",cors(),async (req,res) => {

  try {
    const buildings = await ParkingBuilding.find({});
    res.status(200).json(buildings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve car park buildings' });
  }
});

app.post("/login", async (req,res) => {
  const loginForm = req.body.form
  try{
    const isCheck = await Admin.findOne({email:loginForm.email})
    const isCompare = await comparePassword(loginForm.password,isCheck.password)
    console.log(isCheck)

    if (isCheck && isCompare) {
      isCheck.password = loginForm.password ? res.json({level:isCheck.level,username:isCheck.name, message:"LoginPass"}) : res.json("loginFail")
      console.log(isCheck.name)
    }
    else{
      res.json("No user")
    }
  }
  catch(e){
    console.log(e)
    res.json("fail")
  }
})

app.post("/sign-up",async(req,res) => {
  const form = req.body.form
  const data=new Admin({
    name:form.name,
    email:form.email,
    password:await hashPassword(form.password),
    level:2

  })

  try{
    const check =  await Admin.findOne({email:form.email})

    if(check){
      res.json("exist")
    }
    else{
      res.json("Not Exist")
      console.log("is here")
      await data.save()
    }
  }
  catch(e){
    console.log(e)
    res.json("fail")
  }
})

app.listen(PORT,()=>{
  console.log("Port Connected")
})