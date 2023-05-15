const mongoose=require("mongoose")
const cors=require("cors")
const bcrypt = require("bcryptjs")
const express = require("express")
const User = require("./database/model/user.model")
const PORT = process.env.PORT || 8000
const jwt = require("jsonwebtoken")

mongoose.connect("mongodb+srv://lee:aUB9yJ4qxMDmjqnu@cluster-sunpark.ipsvmza.mongodb.net/test")

const app=express()
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(cors())

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
})

app.post("/login", async (req,res) => {
  const JWT_secret = "secret-key";
  const loginForm = req.body.form
  const token = jwt.sign({name:loginForm.name,email:loginForm.email}, JWT_secret)
  try{
    const isCheck = await User.findOne({email:loginForm.email})
    const isCompare = await comparePassword(loginForm.password,isCheck.password)
    console.log(isCheck)

    if (isCheck && isCompare) {
      isCheck.password = loginForm.password ? res.json({token:token,username:isCheck.name, message:"LoginPass"}) : res.json("loginFail")
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
  const secret = "0d3063ed7ce0dcac5d8624192b120106c8a054939f26d502192b985a69cad1dc"
  const form = req.body.form
  const usertoken = jwt.sign({name:form.name},secret)
  const data=new User({
    name:form.name,
    email:form.email,
    password:await hashPassword(form.password),
    token:usertoken
  })

  try{
    const check =  await User.findOne({email:form.email})

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