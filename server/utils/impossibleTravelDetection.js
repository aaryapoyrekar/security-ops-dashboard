// server/utils/impossibleTravelDetection.js
const Alert = require("../models/Alert");
const LoginEvent = require("../models/LoginEvent");
const RiskProfile = require("../models/RiskProfile");
const { calculateDistanceKm } = require("./geoUtils");
const { getMitreMapping } = require("./mitreMappings");

const MAX_SPEED_KMH = 900;

async function checkImpossibleTravel(userId, ipAddress, latitude, longitude, io) {
  try {
    console.log(`✈️ Impossible Travel check for user: ${userId}`);

    const lastEvent = await LoginEvent.findOne(
      { userId, latitude: { $exists: true }, longitude: { $exists: true } },
      {},
      { sort: { timestamp: -1 } }
    );

    await LoginEvent.create({
      userId,
      ipAddress,
      latitude,
      longitude,
      timestamp: new Date(),
    });

    if (!lastEvent) {
      console.log("ℹ️ No previous login event found — skipping travel check");
      return { detected: false };
    }

    const distanceKm = calculateDistanceKm(
      lastEvent.latitude,
      lastEvent.longitude,
      latitude,
      longitude
    );

    const timeDiffHours =
      (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60);

    const speedKmh = distanceKm / timeDiffHours;

    console.log(`📍 Distance: ${distanceKm.toFixed(2)} km | Time: ${timeDiffHours.toFixed(2)} hrs | Speed: ${speedKmh.toFixed(2)} km/h`);

    if (speedKmh > MAX_SPEED_KMH && distanceKm > 100) {
      const mitreData = getMitreMapping("impossible_travel");

      const alert = await Alert.create({
        source: "Security Engine",
        attackType: "impossible_travel",
        severity: "High",
        confidence: "High",
        reason: `User traveled ${distanceKm.toFixed(0)} km in ${(timeDiffHours * 60).toFixed(0)} minutes (${speedKmh.toFixed(0)} km/h)`,
        signals: [
          `Previous location: ${lastEvent.city || lastEvent.latitude + "," + lastEvent.longitude}`,
          `Current location: ${latitude},${longitude}`,
          `Speed: ${speedKmh.toFixed(0)} km/h`,
        ],
        riskEntity: userId,
        timestamp: new Date(),
        meta: {
          userId,
          previousLocation: {
            latitude: lastEvent.latitude,
            longitude: lastEvent.longitude,
            timestamp: lastEvent.timestamp,
          },
          currentLocation: { latitude, longitude, ipAddress },
          distanceKm,
          speedKmh,
        },
        mitre: mitreData || {},
      });

      // ✅ Update RiskProfile with "Impossible travel detected" signal
      await RiskProfile.findOneAndUpdate(
        { entityType: "user", entityId: userId },
        {
          $addToSet: { signals: "Impossible travel detected" },
          $set: { lastSeen: new Date() },
        },
        { upsert: true }
      );

      if (io) {
        io.emit("new-alert", alert);
      }

      console.log(`🚨 Impossible Travel detected for user: ${userId} — ${speedKmh.toFixed(0)} km/h`);
      return { detected: true, alert };
    }

    return { detected: false };
  } catch (err) {
    console.error("Impossible Travel Detection error:", err);
    return { detected: false };
  }
}

module.exports = checkImpossibleTravel;