const mongoose=require("mongoose");
const { Schema, model } = mongoose;

const reservationSchema = new Schema({
    name: {
      type: String,
      required: true,
    },
    user:{
        type:Object
    },
    parkingLot:{
        type:Object,
    },
    carPlate:{
        type:String
      },
      startTime:{
        type:Date,
      },
      endTime:{
        type:Date,
      }
  });
  
  const Reservation = model('reservation', reservationSchema);
  module.exports= Reservation;