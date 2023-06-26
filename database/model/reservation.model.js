const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const reservationSchema = new Schema({
  parkingLotName: {
    type: String,
    required: true,
  },
  user: {
    type: Object,
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
  isReserved: {
    type: Boolean,
    default: false,
  },
});

const Reservation = model("reservation", reservationSchema);
module.exports = Reservation;
