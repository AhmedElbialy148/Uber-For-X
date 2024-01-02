const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const copSchema = new Schema(
  {
    copId: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    earnedRatings: {
      type: Number,
    },
    totalRatings: {
      type: Number,
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

    copStatus: {
      type: String,
      default: "on-duty",
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Cop", copSchema);
