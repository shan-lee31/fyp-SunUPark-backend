const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const reservationSchema = new Schema({
  parkingLotName: {
    type: String,
    required: true,
  },
  user_id: {
    type: String,
  },
  user: {
    type: String,
  },
  reservedAt: {
    type: String,
  },
  carPlate: {
    type: String,
  },
  approvalStatus: {
    type: String,
    default: "-",
  },
  rejectReason: {
    type: String,
    default: "",
  },
  isReserved: {
    type: Boolean,
    default: false,
  },
});

const Reservation = model("reservation", reservationSchema);
module.exports = Reservation;
