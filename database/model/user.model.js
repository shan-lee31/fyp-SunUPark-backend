const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  email: {
    type: String,
    minLength: 10,
    required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  level: {
    type: Number,
    default: 3,
  },
  carPlate: {
    type: String,
  },
  parkingLotId: {
    type: String,
    default: "",
  },
  reservedParkingLotId: {
    type: Object,
  },
});

const User = model("User", userSchema);
module.exports = User;
