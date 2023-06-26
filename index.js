const mongoose = require("mongoose");
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

mongoose.connect(
  "mongodb+srv://lee:aUB9yJ4qxMDmjqnu@cluster-sunpark.ipsvmza.mongodb.net/test"
);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

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

app.get("/availableReserveParkingLots", cors(), async (req, res) => {
  try {
    const reservedParkingLots = await ParkingLot.find({
      type: "reserveParking",
      isReserved: false,
    });
    res.status(200).json(reservedParkingLots);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve car park lots" });
  }
});

app.get("/parkingLotsStatus", cors(), async (req, res) => {
  try {
    const parkingLots = await ParkingLot.find({}).sort({ name: 1 });
    res.status(200).json(parkingLots);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve car park lots" });
  }
});

app.post("/reservation", cors(), async (req, res) => {
  const details = req.body.allReservationDetails;
  console.log(details);
  const data = new Reservation({
    approvalStatus: details.chosenLotStatus,
    reservedAt: details.reservedAt,
    user: details.studentName,
    carPlate: details.carPlate,
    parkingLotName: details.chosenLot,
  });
  try {
    const isExist = await ParkingLot.findOne({
      name: details.chosenLot,
    });
    console.log(isExist);
    if (isExist) {
      await data.save();
      res.json("updated");
    } else {
      console.log("error");
      return res.json({ message: "failed" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed" });
  }
});

app.post("/parkingQrCode/endSession", cors(), async (req, res) => {
  const lotId = req.body.parkingLot;
  console.log(lotId);
  try {
    const isExist = await ParkingLot.findOne({ _id: lotId });
    if (!isExist) {
      console.log("not exist");
      return res.status(404).json({ error: "Record not found" });
    } else {
      //update lot availability
      await ParkingLot.findByIdAndUpdate(lotId, { isAvailable: true });
      return res.json({ message: "success" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

app.post("/parkingQrCode/get", cors(), async (req, res) => {
  const lotId = req.body.parkingLot;
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
      } else await ParkingLot.findByIdAndUpdate(lotId, { isAvailable: false });
      return res.json({ message: "success", lot: isExist.name });
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
    res.status(500).json({ error: "Failed to retrieve car park buildings" });
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
  console.log(updateForm);
  try {
    const isExist = await User.findOne({ email: updateForm.email });
    console.log(isExist);

    if (isExist) {
      await User.updateOne({
        name: updateForm.name,
        carPlate: updateForm.carPlate,
        phoneNumber: updateForm.phoneNumber,
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
  console.log(loginForm.email);
  try {
    const isCheck = await User.findOne({ email: loginForm.email });
    console.log(isCheck, isCheck);
    const isCompare = await comparePassword(
      loginForm.password,
      isCheck.password
    );

    if (isCheck && isCompare) {
      res.json({
        email: isCheck.email,
        level: isCheck.level,
        name: isCheck.name,
        carPlate: isCheck.carPlate,
        parkingLot: isCheck.parkingLotId,
        phone: isCheck.phoneNumber,
        reservedParkingLotId: isCheck.parkingLotId,
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
