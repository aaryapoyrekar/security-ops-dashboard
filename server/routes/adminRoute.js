const express = require("express");
const router = express.Router();
const RiskProfile = require("../models/RiskProfile");
const adminAuth = require("../middleware/adminAuth");
const auditLogger = require("../middleware/auditLogger");

router.use("/alerts", adminAuth);
router.use("/logs", adminAuth);
router.use("/users", adminAuth);
router.use("/settings", adminAuth);
router.use(auditLogger("ADMIN_ACCESS"));

// 🔐 GET all risk profiles (SOC view)
router.get("/risk-profiles", async (req, res) => {
  try {
    const profiles = await RiskProfile.find().sort({ riskScore: -1 });
    res.json({ success: true, profiles });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/dashboard", adminAuth, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Admin Dashboard",
    admin: {
      adminId: req.tokenPayload.adminId,
      role: req.tokenPayload.role,
      mfa: req.tokenPayload.mfa,
      iat: req.tokenPayload.iat,
      exp: req.tokenPayload.exp
    }
  });
});

router.get("/dashboard/overview", adminAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      stats: {
        totalIncidents: 128,
        highRiskAlerts: 12,
        mediumRiskAlerts: 37,
        lowRiskAlerts: 79,
        failedLogins: 23,
        blockedIPs: 6
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});





/* ==============================
   STEP 6.2 — ADMIN OVERRIDES
   ============================== */

/* 🔒 Lock User */
router.post("/lock/:entityId", async (req, res) => {
  await RiskProfile.findOneAndUpdate(
    { entityId: req.params.entityId },
    {
      status: "locked",
      lockUntil: new Date(Date.now() + 30 * 60 * 1000),
      lastIncidentAt: new Date()
    }
  );
  res.json({ success: true, message: "User locked" });
});

/* 🔓 Unlock User */
router.post("/unlock/:entityId", async (req, res) => {
  await RiskProfile.findOneAndUpdate(
    { entityId: req.params.entityId },
    {
      status: "active",
      lockUntil: null
    }
  );
  res.json({ success: true, message: "User unlocked" });
});

/* ⭐ Trust User (False Positive) */
router.post("/trust/:entityId", async (req, res) => {
  await RiskProfile.findOneAndUpdate(
    { entityId: req.params.entityId },
    {
      riskScore: 0,
      riskLevel: "Low",
      confidence: "Low",
      signals: [],
      status: "trusted",
      lastRiskUpdateAt: new Date()
    }
  );
  res.json({ success: true, message: "User marked as trusted" });
});

/* 🚫 Blacklist User */
router.post("/blacklist/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const newStatus = "blacklisted";

    const profile = await RiskProfile.findOne({ entityId: userId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ ADD THIS BLOCK HERE
    const allowedStatuses = ["active", "locked", "blacklisted"];
    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: ${newStatus}`,
      });
    }

    profile.status = newStatus;
    profile.lastIncidentAt = new Date();
    await profile.save();

    res.json({ success: true, message: "User blacklisted" });
  } catch (err) {
    console.error("Blacklist error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
