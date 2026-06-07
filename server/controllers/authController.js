const LoginEvent = require("../models/LoginEvent");
const { checkImpossibleTravel } = require("../services/geoVelocityService");
const {
  applyImpossibleTravelRisk,
  applyBruteForceRisk
} = require("../services/riskService");
const RiskProfile = require("../models/RiskProfile");
const { getGeoFromIP } = require("../services/geoIpService");

/* ================= DEMO GEO OVERRIDE ================= */

/* ================= DEMO GEO OVERRIDE ================= */

function getTestGeo(req) {
  const demoGeoMap = {
    berlin: {
      ip: "8.8.8.8",
      latitude: 52.52,
      longitude: 13.405,
      country: "Germany",
      city: "Berlin",
    },
    mumbai: {
      ip: "1.1.1.1",
      latitude: 19.076,
      longitude: 72.8777,
      country: "India",
      city: "Mumbai",
    },
    tokyo: {
      ip: "133.242.0.0",
      latitude: 35.6762,
      longitude: 139.6503,
      country: "Japan",
      city: "Tokyo",
    },
    london: {
      ip: "51.140.0.0",
      latitude: 51.5074,
      longitude: -0.1278,
      country: "United Kingdom",
      city: "London",
    },
  };

  const key = req.headers["x-test-geo"]?.toLowerCase();
  return demoGeoMap[key] || null;
}



/* ================= LOGIN HANDLER ================= */

async function handleLogin(req, res) {
  try {
    if (!req.body || !req.body.userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const { userId, success = true } = req.body;

    /* ---------- Fetch or Create Risk Profile ---------- */
    let entity = await RiskProfile.findOne({
      entityType: "user",
      entityId: userId,
    });

    if (!entity) {
      entity = await RiskProfile.create({
        entityType: "user",
        entityId: userId,
        riskScore: 0,
        riskLevel: "Low",
        confidence: "Low",
        signals: [],
        failedLogins: 0,
        successfulLogins: 0,
        botIndicators: 0,
        status: "active",
        firstSeen: new Date(),
        lastSeen: new Date(),
      });
    }

    entity.lastSeen = new Date();

    /* =================================================
       🔐 BRUTE FORCE DETECTION (MITRE T1110)
       ================================================= */
    if (!success) {
      entity.failedLogins += 1;

      if (entity.failedLogins >= 5) {
        applyBruteForceRisk(entity);
      }
    } else {
      entity.successfulLogins += 1;
    }

    /* =================================================
       🌍 GEO (OPTIONAL)
       ================================================= */
    let geo = null;
    let loginEvent = null;

    try {
      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress ||
        req.ip;

      const testGeo = getTestGeo(req);
      geo = testGeo || (await getGeoFromIP(ip));

      if (geo && geo.latitude != null && geo.longitude != null) {
        loginEvent = await LoginEvent.create({
          userId,
          ipAddress: geo.ip,
          latitude: geo.latitude,
          longitude: geo.longitude,
          country: geo.country,
          city: geo.city,
          timestamp: new Date(),
        });

        const geoResult = await checkImpossibleTravel(userId, loginEvent);
        if (geoResult.detected) {
          applyImpossibleTravelRisk(entity, geoResult);
        }
      }
    } catch (geoErr) {
      // Ignore geo failure — brute force must still work
      console.warn("Geo lookup failed:", geoErr.message);
    }

    await entity.save();

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = { handleLogin };
