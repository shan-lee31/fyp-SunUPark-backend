const mongoose=require("mongoose");
const { Schema, model } = mongoose;

const parkingBuildingSchema = new Schema({
    name: {
      type: String,
      required: true,
    },
    googlePlusCode: {
      type: String,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    capacity:{
      type:Number,
    }
  });
  
  const ParkingBuilding = model('parkingBuilding', parkingBuildingSchema);
  module.exports= ParkingBuilding;