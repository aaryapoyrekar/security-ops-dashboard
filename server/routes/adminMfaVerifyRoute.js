const express = require("express");
const speakeasy = require("speakeasy");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const router = express.Router();

/**
 * POST /api/admin/mfa/verify
 * Body: { email, token }
 */
router.post("/verify", async (req, res) => {
  try {
    const { email, token } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin || !admin.mfaSecret) {
      return res.status(401).json({ message: "MFA not configured" });
    }

    const verified = speakeasy.totp.verify({
      secret: admin.mfaSecret,
      encoding: "base32",
      token,
      window: 1
    });

    if (!verified) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    admin.mfaEnabled = true;
    await admin.save();

    const jwtToken = jwt.sign(
      { adminId: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token: jwtToken
    });

  } catch (err) {
    console.error("MFA verify error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
