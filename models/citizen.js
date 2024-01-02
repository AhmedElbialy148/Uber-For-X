const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const citizenSchema = new Schema(
  {
    userName: String,

    phoneNumber: String,

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
        default: 'Point',
      },
      address: String,
      coordinates: [Number],
    },

    verifCode: {
      type: String,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Citizen', citizenSchema);
