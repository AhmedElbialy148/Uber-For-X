const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.ObjectId;

const requestSchema = new Schema(
  {
    userId: {
      type: ObjectId,
      required: true,
      ref: "Citizen",
    },
    copId: {
      type: String,
      ref: "Cop",
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
    reqStatus: {
      type: String,
      default: "suspended",
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Request", requestSchema);
