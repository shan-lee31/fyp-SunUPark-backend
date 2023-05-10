const mongoose=require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new Schema({
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
    token:{
      type:String
    }
  });
  
  const User = model('User', userSchema);
  module.exports=User;