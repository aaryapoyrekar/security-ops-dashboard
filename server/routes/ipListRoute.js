// server/routes/ipListRoute.js
const express = require("express");
const router = express.Router();
const IpList = require("../models/IpList");
const adminAuth = require("../middleware/adminAuth");

// GET all IPs
router.get("/", adminAuth, async (req, res) => {
  const ips = await IpList.find().sort({ createdAt: -1 });
  res.json({ success: true, ips });
});

// ADD an IP
router.post("/", adminAuth, async (req, res) => {
  try {
    const { ip, type, reason } = req.body;
    const entry = await IpList.create({ ip, type, reason });
    res.json({ success: true, entry });
  } catch (err) {
    res.status(400).json({ message: "IP already exists or invalid data" });
  }
});

// DELETE an IP
router.delete("/:id", adminAuth, async (req, res) => {
  await IpList.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "IP removed" });
});

module.exports = router;