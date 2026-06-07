// server/routes/alertsRoute.js
const express = require("express");
const router = express.Router();
const Joi = require("joi");

const Alert = require("../models/Alert");
const Log = require("../models/log");
const RiskProfile = require("../models/RiskProfile");
const checkImpossibleTravel = require("../utils/impossibleTravelDetection");
const { getMitreMapping } = require("../utils/mitreMappings");

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

/* ================= CONFIG ================= */

const RISK_WINDOW_MS = 60 * 1000;
const LOCK_DURATION_MS = 10 * 60 * 1000;

const behaviorTracker = new Map();

/* ================= Joi Schema ================= */

const alertSchema = Joi.object({
  source: Joi.string().default("Web App"),
  type: Joi.string().required(),
  value: Joi.string().allow("", null).default(""),
  endpoint: Joi.string().default("/"),
  timestamp: Joi.date().optional(),
  severity: Joi.string().valid("Low", "Medium", "High").default("Low"),
  extra: Joi.object().unknown(true).default({}),
});

/* ================= Normalize ================= */

function normalizeAlert(raw) {
  return {
    source: raw.source || "Web App",
    type: raw.type || "unknown_event",
    value: raw.value || "",
    endpoint: raw.endpoint || "/",
    timestamp: raw.timestamp ? new Date(raw.timestamp) : new Date(),
    severity: raw.severity || "Low",
    extra: raw.extra || {},
  };
}

/* ================= RISK ANALYSIS ================= */

function analyzeRisk(entityKey, extra) {
  const now = Date.now();
  const record = behaviorTracker.get(entityKey) || { timestamps: [] };

  record.timestamps = record.timestamps.filter(
    (t) => now - t <= RISK_WINDOW_MS
  );
  record.timestamps.push(now);
  behaviorTracker.set(entityKey, record);

  let riskScore = 0;
  const signals = [];

  if (record.timestamps.length >= 4) {
    riskScore += 15;
    signals.push("Multiple failed login attempts");
  }

  if (record.timestamps.length >= 2) {
    const diffs = record.timestamps
      .slice(1)
      .map((t, i) => t - record.timestamps[i]);
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;

    if (avg < 2000) {
      riskScore += 20;
      signals.push("Unnaturally fast login attempts");
    }
  }

  if (!extra?.userAgent) {
    riskScore += 10;
    signals.push("Missing user-agent header");
  }

  if (!extra?.deviceHash) {
    riskScore += 10;
    signals.push("Missing device fingerprint");
  }

  let riskLevel = "Low";
  let confidence = "Low";
  let isBot = false;

  if (riskScore >= 35) {
    riskLevel = "High";
    confidence = "High";
    isBot = true;
  } else if (riskScore >= 25) {
    riskLevel = "Medium";
    confidence = "Medium";
  }

  return { riskScore, riskLevel, confidence, signals, isBot };
}

/* ================= POST /api/alerts ================= */

router.post("/", async (req, res) => {
  const payload = Array.isArray(req.body) ? req.body : [req.body];
  const io = req.app.get("io");

  for (const raw of payload) {
    const normalized = normalizeAlert(raw);
    const { error, value } = alertSchema.validate(normalized);
    if (error) return res.status(400).json({ error: "validation_failed" });

    const entityId = value.value || value.extra?.deviceHash || "unknown";
    const entityType = value.value ? "user" : "device";

    /* ---------- BASE ALERT ---------- */
    const baseAlert = await Alert.create({
      source: value.source,
      attackType: value.type,
      severity: value.severity,
      confidence: "Low",
      reason: value.extra?.failureReason || "",
      timestamp: value.timestamp,
      meta: value.extra,
      type: value.type,
      value: value.value,
      endpoint: value.endpoint,
      extra: value.extra,
    });

    const baseLog = await Log.create({
      message:
        value.type === "login_attempt"
          ? value.extra?.success
            ? "Successful login"
            : "Login failed"
          : value.type,
      level: value.extra?.success === false ? "High" : "Info",
      source: value.source,
      timestamp: value.timestamp,
    });

    if (io) {
      io.emit("new-alert", baseAlert);
      io.emit("new-log", baseLog);
    }

    // ✈️ Impossible Travel Detection
    if (value.extra?.latitude && value.extra?.longitude) {
      checkImpossibleTravel(
        entityId,
        value.extra?.ip || "unknown",
        value.extra.latitude,
        value.extra.longitude,
        req.io
      );
    }

    /* ---------- RISK PROFILE ---------- */
    const analysis = analyzeRisk(entityId, value.extra);

    const updateQuery = {
      $inc: {
        failedLogins: value.extra?.success === false ? 1 : 0,
        successfulLogins: value.extra?.success === true ? 1 : 0,
        botIndicators: analysis.isBot ? 1 : 0,
      },
      $set: {
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        confidence: analysis.confidence,
        lastSeen: new Date(),
        lastRiskUpdateAt: new Date(),
      },
      $addToSet: { signals: { $each: analysis.signals } },
      $setOnInsert: { firstSeen: new Date(), entityType, entityId },
    };

    // MITRE mapping
    const mitreEntries = [];
    if (analysis.isBot) {
      const m = getMitreMapping("automated_login_attempt");
      if (m) mitreEntries.push({ ...m, detectedAt: new Date() });
    }
    if (value.extra?.success === false) {
      const m = getMitreMapping("Failed Login");
      if (m) mitreEntries.push({ ...m, detectedAt: new Date() });
    }
    if (mitreEntries.length > 0) {
      updateQuery.$push = { mitre: { $each: mitreEntries } };
      delete updateQuery.$addToSet.mitre;
    }

    if (analysis.isBot) {
      updateQuery.$set.status = "locked";
      updateQuery.$set.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      updateQuery.$set.lastIncidentAt = new Date();
    }

    await RiskProfile.findOneAndUpdate(
      { entityType, entityId },
      updateQuery,
      { upsert: true }
    );

    /* ---------- BOT ALERT ---------- */
    if (analysis.isBot) {
      const botAlert = await Alert.create({
        source: "Security Engine",
        attackType: "automated_login_attempt",
        severity: "High",
        confidence: analysis.confidence,
        reason: "Automated login behavior detected",
        signals: analysis.signals,
        timestamp: new Date(),
        meta: value.extra,
      });

      const botLog = await Log.create({
        message: "Automated login attempt detected (BOT)",
        level: "High",
        source: "Security Engine",
        timestamp: new Date(),
      });

      if (io) {
        io.emit("new-alert", botAlert);
        io.emit("new-log", botLog);
      }

      behaviorTracker.delete(entityId);
    }
  }

  return res.json({ success: true });
});

module.exports = router;