const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔒 MFA REQUIRED FOR ALL PROTECTED ROUTES
    if (!decoded.mfaVerified) {
  return res.status(403).json({ message: "MFA verification required" });
}

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = admin;
    req.tokenPayload = decoded;

    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
