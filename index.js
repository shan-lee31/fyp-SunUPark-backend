const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const express = require("express");
const user = require("./database/model/user.model");
const PORT = process.env.PORT || 3500;
const jwt = require("jsonwebtoken");
const Admin = require("./database/model/admin.model");
const ParkingBuilding = require("./database/model/parkingBuilding.model");
const ParkingLot = require("./database/model/parkingLot.model");
const User = require("./database/model/user.model");
const Reservation = require("./database/model/reservation.model");
const moment = require("moment");

mongoose.connect(
  "mongodb+srv://lee:aUB9yJ4qxMDmjqnu@cluster-sunpark.ipsvmza.mongodb.net/test"
);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
let countReserveRequest = 0;
const today = moment(new Date()).format("YYYY-MM-DD");

const resetDuration = moment.duration(10, "minutes");

const resetDatabase = async () => {
  // Get the current time
  const currentTime = moment();
  // Calculate the reset time by adding the reset duration to the current time
  const resetTime = moment(currentTime).add(resetDuration);
  // Check if the current time has surpassed the reset time
  console.log("reset", resetTime);
  console.log("currenttime", currentTime);

  await ParkingLot.updateMany({
    isReserved: false,
    isAvailable: true,
  });
  await User.updateMany({
    parkingLotId: "",
    reservedParkingLotId: "",
  });
  await Reservation.updateMany(
    {
      reservedAt: {
        $lt: today,
      },
    },
    {
      approvalStatus: "OVERDUE",
      isReserved: false,
    }
  );
  console.log("Database value has been reset.");
};

function startResetInterval() {
  // Call the function immediately for the first time
  resetDatabase();

  setInterval(resetDatabase, resetDuration.asMilliseconds());
}

// Start the interval
//startResetInterval();

const insertDefaultData = async () => {
  const defaultParkingBuilding = [
    {
      name: "Sunway University Parking",
      googlePlusCode: "6PM33J83+CH",
      latitude: 3.0673552584945933,
      longitude: 101.6038946395742,
      capacity: 10,
    },
    {
      name: "Sunway Pyramid",
      googlePlusCode: "6PM33JC4+RG",
      latitude: 3.072255111569047,
      longitude: 101.60639913957425,
      capacity: 10000,
    },
    {
      name: "SunU-Monash BRT PARK N RIDE",
      googlePlusCode: "6PM33J82+68r",
      latitude: 3.0658264755925493,
      longitude: 101.60212492127722,
      capacity: 3000,
    },
  ];
  await ParkingBuilding.create(defaultParkingBuilding);
};

const insertParkingLot = async () => {
  const defaultParkingLot = [
    {
      name: "R-1",
      type: "reserveParking",
    },
    {
      name: "R-2",
      type: "reserveParking",
    },
    {
      name: "R-3",
      type: "reserveParking",
    },
    {
      name: "Zone A - 1",
      type: "normal",
    },
    {
      name: "Zone A - 2",
      type: "normal",
    },
    {
      name: "Zone A - 3",
      type: "normal",
    },
    {
      name: "Zone A - 4",
      type: "normal",
    },
    {
      name: "Zone B - 1",
      type: "normal",
    },
    {
      name: "Zone B - 2",
      type: "normal",
    },
    {
      name: "Zone B - 3",
      type: "normal",
    },
    {
      name: "Zone B - 4",
      type: "normal",
    },
  ];
  await ParkingLot.create(defaultParkingLot);
};

async function hashPassword(password) {
  const res = await bcrypt.hash(password, 10);
  return res;
}

async function comparePassword(userPassword, hashPassword) {
  const res = await bcrypt.compare(userPassword, hashPassword);
  return res;
}

app.get("/", cors(), (req, res) => {
  res.send("hello from backend");
});

app.get("/parkingBuildings", cors(), (req, res) => {
  res.send("parkingBuildings");
  insertDefaultData();
});

app.get("/parkingQrcode", cors(), (req, res) => {
  res.send("Qr Code");
  insertParkingLot();
});

app.get("/availableParkingLots", cors(), async (req, res) => {
  try {
    const parkingLots = await ParkingLot.find({
      type: "normal",
      isAvailable: true,
    });
    res.status(200).json(parkingLots);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve car park lots" });
  }
});

app.get("/get-admin-home-data", cors(), async (req, res) => {
  try {
    const parkingLots = await ParkingLot.find({
      type: "normal",
      isAvailable: true,
    });
    const reserveRequest = await Reservation.find({
      approvalStatus: "pending",
    });
    const users = await User.find({});

    res.status(200).json({
      availableLots: parkingLots.length,
      reserveRequest: reserveRequest.length,
      users: users.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve car park lots" });
  }
});

app.get("/availableReserveParkingLots", cors(), async (req, res) => {
  try {
    const reservedParkingLots = await ParkingLot.find({
      type: "reserveParking",
      isReserved: false,
    });
    const rParkingLots = await ParkingLot.find({
      type: "reserveParking",
    });
    res.status(200).json({
      reservedParkingLots: reservedParkingLots,
      rParkingLots: rParkingLots,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve car park lots" });
  }
});

app.get("/parkingLotsStatus", cors(), async (req, res) => {
  try {
    const parkingLots = await ParkingLot.find({ type: "normal" }).sort({
      name: 1,
    });
    res.status(200).json(parkingLots);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve car park lots" });
  }
});

app.post("/cancelReservation", cors(), async (req, res) => {
  const value = req.body.lot;
  const userId = req.body.userId;
  console.log("cancel", value, userId);
  try {
    const isExist = await Reservation.findOne({
      parkingLotName: value,
      user_id: userId,
    });
    if (isExist) {
      await Reservation.updateOne(
        { user_id: userId },
        { approvalStatus: "CANCELLED", isReserved: false }
      );
      return res.json({ message: "cancelled" });
    }
  } catch (error) {
    console.log("error");
  }
});

app.post("/rejectReservation", async (req, res) => {
  const reservationDetails = req.body.selectedReservation;
  const reason = req.body.rejectForm.reason;
  console.log(reservationDetails);
  try {
    const isExist = await Reservation.findOne({
      parkingLotName: reservationDetails.lotName,
      user_email: reservationDetails.email,
    });

    console.log("reject", isExist);
    if (isExist) {
      console.log(isExist);
      await Reservation.updateOne(
        {
          parkingLotName: reservationDetails.lotName,
          user_email: reservationDetails.email,
        },
        { approvalStatus: "REJECTED", isReserved: false, rejectReason: reason }
      );
      return res.json({ data: reservationDetails, message: "rejected" });
    }
  } catch (error) {
    console.log("error");
  }
});

app.post("/approveReservation", async (req, res) => {
  const reservationDetails = req.body.selectedReservation;
  const userId = reservationDetails.user_id;
  console.log("reservationDetails", reservationDetails);
  try {
    const isExist = await Reservation.findOne({
      user_id: reservationDetails.user_id,
      parkingLotName: reservationDetails.lotName,
      approvalStatus: "pending",
      reservedAt: {
        $regex: "^" + today,
      },
    });
    console.log("isExist", isExist);
    if (isExist) {
      await Reservation.findOneAndUpdate(
        {
          user_id: reservationDetails.user_id,
          parkingLotName: reservationDetails.lotName,
          approvalStatus: "pending",
          reservedAt: {
            $regex: "^" + today,
          },
        },
        { approvalStatus: "APPROVED", isReserved: true }
      );
      await User.updateOne(
        { _id: userId },
        { reservedParkingLotId: reservationDetails.lotName }
      );
      await ParkingLot.updateOne(
        { name: reservationDetails.lotName },
        { isReserved: true }
      );

      return res.json({ data: reservationDetails, message: "success" });
    }
  } catch (error) {
    console.log("error");
  }
});

app.get("/retrieveCancelledReservation", cors(), async (req, res) => {
  try {
    const cancelled = await Reservation.find({ approvalStatus: "CANCELLED" });
    res.status(200).json(cancelled);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve cancelled reservations" });
  }
});

app.get("/retrieveUserReservationStatus", cors(), async (req, res) => {
  const userId = req.query.value;
  console.log("user reservation staatus");
  //const lot = req.query.value2;
  // console.log(userId);
  try {
    const user = await User.findOne({ _id: userId });
    const reservationStatus = await Reservation.findOne({
      user_id: userId,
      reservedAt: {
        $regex: "^" + today,
      },
      //parkingLotName: lot,
    });
    console.log("here", reservationStatus);
    if (reservationStatus.approvalStatus == "APPROVED") {
      console.log("approved");
      res
        .status(200)
        .json({ message: "APPROVED", data: reservationStatus.parkingLotName });
    }
    if (reservationStatus.approvalStatus == "REJECTED") {
      console.log("rejection logic");
      res.status(200).json({ message: "rejected", data: reservationStatus });
    }
    if (reservationStatus.approvalStatus == "pending") {
      console.log("pending");
      res.status(200).json({ message: "pending", data: reservationStatus });
    }
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.get("/retrieveApprovedReservation", cors(), async (req, res) => {
  try {
    const approved = await Reservation.find({
      approvalStatus: "APPROVED",
    }).sort({ reservedAt: 1 });
    res.status(200).json(approved);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve reservations" });
  }
});

app.get("/retrieveOverdueReservation", cors(), async (req, res) => {
  try {
    const overdue = await Reservation.find({
      approvalStatus: "OVERDUE",
    }).sort({ reservedAt: 1 });
    res.status(200).json(overdue);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve reservations" });
  }
});

app.get("/retrieveRejectedReservation", cors(), async (req, res) => {
  try {
    const rejected = await Reservation.find({ approvalStatus: "REJECTED" });
    res.status(200).json(rejected);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve reservations" });
  }
});

app.get("/retrieveReservation", cors(), async (req, res) => {
  try {
    const reservations = await Reservation.find({ approvalStatus: "pending" });
    res.status(200).json(reservations);
    console.log(reservations);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve reservations" });
  }
});

app.post("/reservation", cors(), async (req, res) => {
  const details = req.body.allReservationDetails;
  console.log("details", details.email);
  const data = new Reservation({
    user_id: details.id,
    user_email: details.email,
    approvalStatus: details.chosenLotStatus,
    reservedAt: details.reservedAt,
    user: details.studentName,
    carPlate: details.studentCarPlate,
    parkingLotName: details.chosenLot,
  });
  console.log("data", data);
  try {
    const isLotExist = await ParkingLot.findOne({
      name: details.chosenLot,
    });
    const isUserExist = await Reservation.findOne({
      user_id: details.id,
      reservedAt: {
        $regex: "^" + today,
      },
      approvalStatus: {
        $in: ["pending", "APPROVED", "REJECTED"],
      },
    });
    console.log(isLotExist, isUserExist);
    if (isUserExist) {
      res.json({ message: "has reservation", data: isUserExist });
    } else {
      if (isLotExist) {
        console.log(isLotExist);
        await data.save();
        res.json("updated");
      } else {
        console.log("error");
        return res.json({ message: "failed" });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed" });
  }
});

app.post("/parkingQrCode/endSession", cors(), async (req, res) => {
  const lotName = req.body.parkingLot;
  const userId = req.body.userId;
  console.log(lotName);
  try {
    const isExist = await ParkingLot.findOne({ name: lotName });
    if (!isExist) {
      console.log("not exist");
      return res.status(404).json({ error: "Record not found" });
    } else {
      //update lot availability
      await ParkingLot.findOneAndUpdate(
        { name: lotName },
        { isAvailable: true }
      );
      //update User
      await User.findOneAndUpdate({ _id: userId }, { parkingLotId: "" });
      return res.json({ message: "success" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

app.post("/parkingQrCode/get", cors(), async (req, res) => {
  const lotId = req.body.parkingLot;
  const userId = req.body.userId;
  console.log(lotId);
  try {
    if (!mongoose.Types.ObjectId.isValid(lotId)) {
      return res.status(400).json({ error: "Bad request" });
    }
    const isExist = await ParkingLot.findOne({ _id: lotId });
    if (!isExist) {
      console.log("not exist");
      return res.status(404).json({ error: "Record not found" });
    } else {
      if (await ParkingLot.findOne({ _id: lotId, isAvailable: false })) {
        return res.json({ message: "occupied" });
      } else {
        await ParkingLot.findByIdAndUpdate(lotId, { isAvailable: false });
        await User.findByIdAndUpdate(userId, { parkingLotId: isExist.name });
        {
          return res.json({ message: "success", lot: isExist.name });
        }
      }
    }
  } catch (err) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// app.get("/reservedparking", cors(), async (req, res) => {
//   try {
//     const reservedParking = await ParkingLot.find({
//       type: "reservedParking",
//     }).sort({
//       name: 1,
//     });
//     res.status(200).json(reservedParking);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to retrieve reserved parking" });
//   }
// });

app.get("/carparkbuilding", cors(), async (req, res) => {
  try {
    const buildings = await ParkingBuilding.find({});
    res.status(200).json(buildings);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve car park buildings" });
  }
});

app.get("/manageuser", cors(), async (req, res) => {
  const objectIdToExclude = "6463a03128621e52009ede2d";
  try {
    const admin = await Admin.find({ _id: { $ne: objectIdToExclude } });
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve admin" });
  }
});

app.delete("/deleteUserInfo/:recordId", async (req, res) => {
  const { recordId } = req.params;
  try {
    const isExist = await Admin.findOne({ _id: recordId });
    if (!isExist) {
      return res.status(404).json({ error: "Record not found" });
    } else {
      await Admin.deleteOne({ _id: recordId });
      return res.json({ message: "Record deleted successfully" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/deleteCarParkInfo/:recordId", async (req, res) => {
  const { recordId } = req.params;
  try {
    const isExist = await ParkingBuilding.findOne({ _id: recordId });
    if (!isExist) {
      return res.status(404).json({ error: "Record not found" });
    } else {
      await ParkingBuilding.deleteOne({ _id: recordId });
      return res.json({ message: "Record deleted successfully" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/addBuilding", async (req, res) => {
  const addBuilding = req.body.addForm;
  console.log(addBuilding);
  const data = new ParkingBuilding({
    name: addBuilding.name,
    googlePlusCode: addBuilding.googlePlusCode,
    capacity: addBuilding.capacity,
  });
  try {
    const isExist = await ParkingBuilding.findOne({ name: addBuilding.name });
    console.log(isExist);

    if (isExist) {
      res.json("exist");
    } else {
      res.json("Not Exist");
      await data.save();
    }
  } catch (e) {
    console.log(e);
    res.json("fail");
  }
});

app.post("/updateCarParkInfo", async (req, res) => {
  const updateForm = req.body.updateInfo;
  console.log(updateForm);
  try {
    const isExist = await ParkingBuilding.findOne({ _id: updateForm._id });
    console.log(isExist);

    if (isExist) {
      await ParkingBuilding.updateOne({
        name: updateForm.name,
        plusCode: updateForm.plusCode,
        capacity: updateForm.capacity,
      });
      res.json({ message: "updateCarParkSuccess" });
    } else {
      res.json("error");
    }
  } catch (e) {
    console.log(e);
    res.json("fail");
  }
});

app.post("/update-user-info", async (req, res) => {
  const updateForm = req.body.editForm;
  console.log("update", updateForm);
  try {
    const isExist = await User.findOne({ email: updateForm.email });
    console.log(isExist);

    if (isExist) {
      await User.updateOne(
        { email: updateForm.email },
        {
          name: updateForm.name,
          carPlate: updateForm.carPlate,
          phoneNumber: updateForm.phoneNumber,
        }
      );
      res.json({ message: "updateCarParkSuccess" });
    } else {
      res.json("error");
    }
  } catch (e) {
    console.log(e);
    res.json("fail");
  }
});

app.post("/login", async (req, res) => {
  const loginForm = req.body.form;
  try {
    const isCheck = await Admin.findOne({ email: loginForm.email });
    const isCompare = await comparePassword(
      loginForm.password,
      isCheck.password
    );
    console.log(isCheck);

    if (isCheck && isCompare) {
      isCheck.password = loginForm.password
        ? res.json({
            level: isCheck.level,
            username: isCheck.name,
            message: "LoginPass",
          })
        : res.json("loginFail");
      console.log(isCheck.name);
    } else {
      res.json("No user");
    }
  } catch (e) {
    console.log(e);
    res.json("fail");
  }
});

app.post("/login/user", async (req, res) => {
  const loginForm = req.body.form;
  let pendingPL;
  console.log(loginForm.email);
  try {
    const isCheck = await User.findOne({ email: loginForm.email });
    console.log(isCheck, isCheck);
    const getPending = await Reservation.findOne({
      user_id: isCheck._id,
      reservedAt: { $regex: "^" + today },
      approvalStatus: "pending",
    });
    const isCompare = await comparePassword(
      loginForm.password,
      isCheck.password
    );

    if (isCheck && isCompare) {
      console.log("getPending", getPending);
      if (getPending) {
        pendingPL = getPending.parkingLotName;
      } else {
        pendingPL = "";
      }
      res.json({
        id: isCheck._id,
        email: isCheck.email,
        level: isCheck.level,
        name: isCheck.name,
        carPlate: isCheck.carPlate,
        parkingLot: isCheck.parkingLotId,
        phone: isCheck.phoneNumber,
        pendingParkingLot: pendingPL,
        reservedParkingLotId: isCheck.reservedParkingLotId,
        message: "LoginPass",
      });
      console.log(isCheck.name);
    } else if (!isCheck) {
      res.json("No user");
    } else {
      res.json("loginFail");
    }
  } catch (e) {
    console.log(e);
    res.json("fail");
  }
});

app.post("/user-reset-password", async (req, res) => {
  const form = req.body.resetPasswordForm;
  console.log(form);

  try {
    const check = await User.findOne({ email: form.email });
    const isCompare = await comparePassword(form.password, check.password);
    console.log("check", check);
    console.log("isCompare", isCompare);
    if (check && isCompare) {
      res.json("same password");
    } else {
      await User.updateOne({
        password: await hashPassword(form.password),
      });
      res.json({ message: "updatePasswordSuccess" });
    }
  } catch (e) {
    console.log(e);
    res.json("fail");
  }
});

app.post("/sign-up/user", async (req, res) => {
  const form = req.body.form;
  console.log(form);
  const data = new User({
    name: form.name,
    email: form.email,
    phoneNumber: form.phone,
    carPlate: form.carPlate,
    parkingLotId: "",
    reservedParkingLotId: "",
    password: await hashPassword(form.password),
    level: 3,
  });

  try {
    const check = await User.findOne({ email: form.email });

    if (check) {
      res.json("exist");
    } else {
      res.json({
        id: data._id,
        email: data.email,
        level: data.level,
        name: data.name,
        carPlate: data.carPlate,
        parkingLot: data.parkingLotId,
        phone: data.phoneNumber,
        message: "Not Exist",
      });
      console.log(data);
      await data.save();
    }
  } catch (e) {
    console.log(e);
    res.json("fail");
  }
});

app.post("/sign-up", async (req, res) => {
  const form = req.body.form;
  const data = new Admin({
    name: form.name,
    email: form.email,
    password: await hashPassword(form.password),
    level: 2,
  });

  try {
    const check = await Admin.findOne({ email: form.email });

    if (check) {
      res.json("exist");
    } else {
      res.json("Not Exist");
      console.log("is here");
      await data.save();
    }
  } catch (e) {
    console.log(e);
    res.json("fail");
  }
});

app.listen(PORT, () => {
  console.log("Port Connected");
});
