const mongoose=require("mongoose");
const { Schema, model } = mongoose;

const adminSchema = new Schema({
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      minLength: 10,
      required: true,
      lowercase: true
    },
    password:{
      type: String,
      required: true,
    },
    level:{
      type:Number,
      default:2,
    }
  });
  
  const Admin = model('Admin', adminSchema);
  module.exports=Admin;