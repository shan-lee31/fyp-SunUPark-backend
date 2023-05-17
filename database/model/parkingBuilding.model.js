const mongoose=require("mongoose");
const { Schema, model } = mongoose;

const parkingBuildingSchema = new Schema({
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    capacity:{
      type:Number,
    },
    availableSpace:{
      type:Number,
    }
  });
  
  const ParkingBuilding = model('parkingBuilding', parkingBuildingSchema);
  module.exports= ParkingBuilding;