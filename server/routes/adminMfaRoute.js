const express = require("express");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const Admin = require("../models/Admin");

const router = express.Router();

/**
 * POST /api/admin/mfa/setup
 * Body: { adminId }
 */
router.post("/setup", async (req, res) => {
  try {
    const { adminId } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const secret = speakeasy.generateSecret({
      length: 20,
      name: "SecurityOpsDashboard",
    });

    admin.mfaSecret = secret.base32;
    await admin.save();

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      qrCode,
      secret: secret.base32, // for demo/testing
    });
  } catch (err) {
    console.error("MFA setup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/admin/mfa/verify
 * Body: { adminId, token }
 */
router.post("/verify", async (req, res) => {
  try {
    const { adminId, token } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin || !admin.mfaSecret) {
      return res.status(400).json({ message: "MFA not setup" });
    }

    const verified = speakeasy.totp.verify({
      secret: admin.mfaSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ message: "Invalid MFA code" });
    }

    admin.mfaEnabled = true;
    await admin.save();

    res.json({ success: true, message: "MFA enabled" });
  } catch (err) {
    console.error("MFA verify error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
