const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const citizenSchema = new Schema({
  userName: String,

  email: {
    type: String,
  },

  password: {
    type: String,
  },

  location: {
    type: {
      type: String,
      required: true,
      default: "Point",
    },
    address: String,
    coordinates: [Number],
  },
});

module.exports = mongoose.model("Citizen", citizenSchema);
