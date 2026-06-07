// server/routes/loginTrendRoute.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const Log = require("../models/log");

router.get("/", adminAuth, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const logs = await Log.find({
      timestamp: { $gte: todayStart },
      message: "Login failed",
    }, "timestamp");

    const hourCounts = {};
    logs.forEach((l) => {
      const hour = new Date(l.timestamp).getHours();
      const label = `${String(hour).padStart(2, "0")}:00`;
      hourCounts[label] = (hourCounts[label] || 0) + 1;
    });

    const trend = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    res.json({ success: true, trend });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;