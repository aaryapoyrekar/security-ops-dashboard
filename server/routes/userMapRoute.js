// server/routes/userMapRoute.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const LoginEvent = require("../models/LoginEvent");
const Alert = require("../models/Alert");

router.get("/:userId", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const events = await LoginEvent.find({
      userId,
      latitude: { $exists: true },
      longitude: { $exists: true },
    }).sort({ timestamp: -1 });

    const totalLogins = await LoginEvent.countDocuments({ userId });
    const failedAttempts = await Alert.countDocuments({
      riskEntity: userId,
      attackType: { $in: ["Failed Login", "Brute Force Attack"] },
    });

    res.json({
      success: true,
      events,
      stats: {
        totalLogins,
        failedAttempts,
        successfulLogins: totalLogins - failedAttempts,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;