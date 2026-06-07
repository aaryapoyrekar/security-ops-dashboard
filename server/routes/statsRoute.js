// server/routes/statsRoute.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const Alert = require("../models/Alert");
const RiskProfile = require("../models/RiskProfile");
const Log = require("../models/log");

router.get("/", adminAuth, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Total alerts today
    const totalAlertsToday = await Alert.countDocuments({
      timestamp: { $gte: todayStart },
    });

    // High severity alerts today
    const highSeverityAlerts = await Alert.countDocuments({
      timestamp: { $gte: todayStart },
      severity: "High",
    });

    // Locked accounts
    const lockedAccounts = await RiskProfile.countDocuments({
      status: { $in: ["locked", "blacklisted"] },
    });

    // Bot detections
    const botDetections = await RiskProfile.countDocuments({
      botIndicators: { $gt: 0 },
    });

    // Failed logins (24h)
    const failedLogins = await Alert.countDocuments({
      timestamp: { $gte: todayStart },
      attackType: { $in: ["Failed Login", "Brute Force Attack"] },
    });

    // Avg risk score
    const riskProfiles = await RiskProfile.find({}, "riskScore entityId");
    const avgRiskScore =
      riskProfiles.length > 0
        ? Math.round(
            riskProfiles.reduce((sum, p) => sum + p.riskScore, 0) /
              riskProfiles.length
          )
        : 0;

    // Peak attack hour
    const alertsToday = await Alert.find({
      timestamp: { $gte: todayStart },
    }, "timestamp");

    const hourCounts = {};
    alertsToday.forEach((a) => {
      const hour = new Date(a.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let peakHour = 0;
    let peakCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > peakCount) {
        peakHour = parseInt(hour);
        peakCount = count;
      }
    });

    // Most targeted user
    const userAlerts = await Alert.aggregate([
      { $match: { riskEntity: { $ne: "" }, timestamp: { $gte: todayStart } } },
      { $group: { _id: "$riskEntity", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const mostTargetedUser =
      userAlerts.length > 0
        ? { id: userAlerts[0]._id, count: userAlerts[0].count }
        : { id: "N/A", count: 0 };

    res.json({
      success: true,
      stats: {
        totalAlertsToday,
        highSeverityAlerts,
        lockedAccounts,
        botDetections,
        failedLogins,
        avgRiskScore,
        peakHour: `${String(peakHour).padStart(2, "0")}:00 (${peakCount})`,
        mostTargetedUser,
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;