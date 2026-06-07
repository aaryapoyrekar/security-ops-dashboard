// server/utils/multiIpDetection.js
const Alert = require("../models/Alert");
const LoginEvent = require("../models/LoginEvent");
const { getMitreMapping } = require("./mitreMappings");

const MULTI_IP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

async function checkMultiIpDetection(userId, ipAddress, io) {
  console.log(`🔍 Multi-IP check for user: ${userId} from IP: ${ipAddress}`);
  try {
    const windowStart = new Date(Date.now() - MULTI_IP_WINDOW_MS);

    const recentEvents = await LoginEvent.find({
      userId,
      timestamp: { $gte: windowStart },
    });

    const uniqueIPs = [...new Set(recentEvents.map((e) => e.ipAddress))];

    if (!uniqueIPs.includes(ipAddress)) {
      uniqueIPs.push(ipAddress);
    }

    await LoginEvent.create({ userId, ipAddress, timestamp: new Date() });

    if (uniqueIPs.length >= 2) {
      const mitreData = getMitreMapping("multi_ip_login");

      const alert = await Alert.create({
        source: "Security Engine",
        attackType: "multi_ip_login",
        severity: "High",
        confidence: "High",
        reason: `User logged in from ${uniqueIPs.length} different IPs within 10 minutes`,
        signals: uniqueIPs.map((ip) => `IP: ${ip}`),
        riskEntity: userId,
        timestamp: new Date(),
        meta: { userId, ipAddresses: uniqueIPs },
        mitre: mitreData || {},
      });

      if (io) {
        io.emit("new-alert", alert);
      }

      console.log(`🚨 Multi-IP Detection triggered for user: ${userId}`);
      return { detected: true, alert };
    }

    return { detected: false };
  } catch (err) {
    console.error("Multi-IP Detection error:", err);
    return { detected: false };
  }
}

module.exports = checkMultiIpDetection;