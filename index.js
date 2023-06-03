const mongoose=require("mongoose")
const cors=require("cors")
const bcrypt = require("bcryptjs")
const express = require("express")
const user = require("./database/model/user.model")
const PORT = process.env.PORT || 3500
const jwt = require("jsonwebtoken")
const Admin = require("./database/model/admin.model")
const ParkingBuilding = require("./database/model/parkingBuilding.model")
const ParkingLot = require("./database/model/parkingLot.model")

mongoose.connect("mongodb+srv://lee:aUB9yJ4qxMDmjqnu@cluster-sunpark.ipsvmza.mongodb.net/test")

const app=express()
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(cors())

const insertDefaultData = async () => { 
  const defaultParkingBuilding =[
  {
    name:"Sunway University Parking",
    googlePlusCode:"6PM33J83+CH",
    capacity:10,
  },
  {
    name:"Sunway Pyramid",
    googlePlusCode:"6PM33JC4+RG",
    capacity:10000,
  },
  {
    name:"SunU-Monash BRT PARK N RIDE",
    googlePlusCode:"6PM33J82+68r",
    capacity:3000,
  },

];
await ParkingBuilding.create(defaultParkingBuilding);
}

const insertParkingLot = async () => { 
  const defaultParkingLot =[
  {
    name:"A1",
  },
  {
    name:"A2",
  },
  {
    name:"A3",
  },
  {
    name:"A4",
  },
  {
    name:"A5",
  },
  {
    name:"A6",
  },
  {
    name:"A7",
  },
  {
    name:"A8",
  },
  {
    name:"A9",
  },
  {
    name:"A10",
  },


];
await ParkingLot.create(defaultParkingLot);
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

app.get("/parkingQrcode",cors(), (req,res) =>{
  res.send("Qr Code")
  insertParkingLot();
})

app.post("/parkingQrCode/get", cors(), async (req,res) => {
  const lotId = req.body.parkingLot;
  console.log(req.body)
  console.log("he")
  try {
    const isExist = await ParkingLot.findOne({ _id: lotId });
    if (!isExist) {
      return res.status(404).json({ error: 'Record not found' });
    } else {
      return res.json({ message: 'success', lot:isExist.name });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


app.get("/carparkbuilding",cors(),async (req,res) => {

  try {
    const buildings = await ParkingBuilding.find({});
    res.status(200).json(buildings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve car park buildings' });
  }
});

app.get("/manageuser",cors(),async (req,res) => {
  const objectIdToExclude = '6463a03128621e52009ede2d';
  try {
    const admin = await Admin.find({ _id: { $ne: objectIdToExclude } });
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve car park buildings' });
  }
});

app.delete('/deleteUserInfo/:recordId', async(req, res) => {
  const { recordId } = req.params;
  try {
    const isExist = await Admin.findOne({ _id: recordId });
    if (!isExist) {
      return res.status(404).json({ error: 'Record not found' });
    } else {
      await Admin.deleteOne({ _id: recordId });
      return res.json({ message: 'Record deleted successfully' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/deleteCarParkInfo/:recordId', async(req, res) => {
  const { recordId } = req.params;
  try {
    const isExist = await ParkingBuilding.findOne({ _id: recordId });
    if (!isExist) {
      return res.status(404).json({ error: 'Record not found' });
    } else {
      await ParkingBuilding.deleteOne({ _id: recordId });
      return res.json({ message: 'Record deleted successfully' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/addBuilding", async (req,res) => {
  const addBuilding = req.body.addForm
  console.log(addBuilding)
  const data=new ParkingBuilding({
    name:addBuilding.name,
    googlePlusCode:addBuilding.googlePlusCode,
    capacity:addBuilding.capacity
  })
  try{
    const isExist = await ParkingBuilding.findOne({name:addBuilding.name})
    console.log(isExist)

    if (isExist) {
      res.json("exist")
    }
    else{
      res.json("Not Exist")
      await data.save()
    }
  }
  catch(e){
    console.log(e)
    res.json("fail")
  }
})

app.post("/updateCarParkInfo", async (req,res) => {
  const updateForm = req.body.updateInfo
  console.log(updateForm)
  try{
    const isExist = await ParkingBuilding.findOne({_id:updateForm._id})
    console.log(isExist)

    if (isExist) {
      await ParkingBuilding.updateOne({ name:updateForm.name,plusCode:updateForm.plusCode,capacity:updateForm.capacity});
      res.json({message:"updateCarParkSuccess"})
    }
    else{
      res.json("error")
    }
  }
  catch(e){
    console.log(e)
    res.json("fail")
  }
})

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