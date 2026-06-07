// server/middleware/ipFilter.js
const IpList = require("../models/IpList");
const Alert = require("../models/Alert");
const { getMitreMapping } = require("../utils/mitreMappings");

async function ipFilter(req, res, next) {
  try {
    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

    const blacklisted = await IpList.findOne({ ip, type: "blacklist" });
    if (blacklisted) {
      console.log(`🚫 Blacklisted IP blocked: ${ip}`);

      const mitreData = getMitreMapping("blacklisted_ip_attempt");

      await Alert.create({
        source: "IP Filter",
        attackType: "blacklisted_ip_attempt",
        severity: "High",
        confidence: "High",
        reason: `Blacklisted IP attempted access: ${ip}`,
        signals: [`IP: ${ip}`, `Reason: ${blacklisted.reason}`],
        riskEntity: ip,
        timestamp: new Date(),
        meta: { ip, reason: blacklisted.reason },
        mitre: mitreData || {},
      });

      return res.status(403).json({
        message: "Access denied — your IP has been blacklisted",
      });
    }

    const whitelistCount = await IpList.countDocuments({ type: "whitelist" });
    if (whitelistCount > 0) {
      const whitelisted = await IpList.findOne({ ip, type: "whitelist" });
      if (!whitelisted) {
        console.log(`🚫 Non-whitelisted IP blocked: ${ip}`);

        const mitreData = getMitreMapping("non_whitelisted_ip_attempt");

        await Alert.create({
          source: "IP Filter",
          attackType: "non_whitelisted_ip_attempt",
          severity: "Medium",
          confidence: "High",
          reason: `Non-whitelisted IP attempted access: ${ip}`,
          signals: [`IP: ${ip}`],
          riskEntity: ip,
          timestamp: new Date(),
          meta: { ip },
          mitre: mitreData || {},
        });

        return res.status(403).json({
          message: "Access denied — your IP is not whitelisted",
        });
      }
    }

    next();
  } catch (err) {
    console.error("IP Filter error:", err);
    next();
  }
}

module.exports = ipFilter;