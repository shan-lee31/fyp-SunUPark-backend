const mongoose=require("mongoose");
const { Schema, model } = mongoose;

const parkingLotSchema = new Schema({
    name: {
      type: String,
      required: true,
    },
    user:{
        type:Object
    },
    isParked:{
        type:Number,
        default:false,
    },
    isReserved:{
        type:Boolean,
        default:false,
    },
    isAvailable:{
        type:Boolean,
        default:true,
    }
  });
  
  const ParkingLot = model('parkingLot', parkingLotSchema);
  module.exports= ParkingLot;