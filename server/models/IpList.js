// server/models/IpList.js
const mongoose = require("mongoose");

const ipListSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["whitelist", "blacklist"],
    required: true,
  },
  reason: {
    type: String,
    default: "",
  },
  addedBy: {
    type: String,
    default: "admin",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("IpList", ipListSchema);