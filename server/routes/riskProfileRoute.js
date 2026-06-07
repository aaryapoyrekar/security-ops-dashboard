// server/routes/riskProfileRoute.js
const express = require("express");
const router = express.Router();
const RiskProfile = require("../models/RiskProfile");
const adminAuth = require("../middleware/adminAuth");

router.get("/", adminAuth, async (req, res) => {
  try {
    const profiles = await RiskProfile.find().sort({ riskScore: -1 });
    res.json({ success: true, profiles });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;