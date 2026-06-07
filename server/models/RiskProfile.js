// server/models/RiskProfile.js
const mongoose = require("mongoose");

/**
 * RiskProfile represents the long-term risk posture
 * of an entity (user, device, or IP).
 *
 * This model enables risk-based security decisions
 * (allow, warn, challenge, block).
 */
const riskProfileSchema = new mongoose.Schema({
  /* -------- Entity Identity -------- */

  entityType: {
    type: String,
    enum: ["user", "device", "ip"],
    required: true,
  },

  /**
   * Examples:
   * - user   → hashed email
   * - device → deviceHash
   * - ip     → 192.168.x.x
   */
  entityId: {
    type: String,
    required: true,
    index: true,
  },

  /* -------- Risk Scoring -------- */

  /**
   * Numeric risk score (0–100)
   * Calculated from failed logins, speed, signals, etc.
   */
  riskScore: {
    type: Number,
    default: 0,
  },

  /**
   * Human-readable classification
   */
  riskLevel: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low",
  },

  /**
   * How confident the system is in this assessment
   */
  confidence: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low",
  },

  /* -------- Risk-Based Response (STEP 2 CORE) -------- */

  /**
   * Current security state of the entity
   * active  → normal behavior
   * locked  → temporarily blocked
   */
  status: {
  type: String,
  enum: ["active", "locked", "blacklisted"],
  default: "active",
}
,

  /**
   * If locked, until when?
   * After this time, access can be restored automatically
   */
  lockUntil: {
    type: Date,
  },

  /* -------- Counters -------- */

  failedLogins: {
    type: Number,
    default: 0,
  },

  successfulLogins: {
    type: Number,
    default: 0,
  },

  botIndicators: {
    type: Number,
    default: 0,
  },

  /* -------- Detection Signals -------- */

  /**
   * Signals that contributed to risk elevation
   * (stored for explainability)
   */
  signals: {
    type: [String],
    default: [],
  },

  /* -------- Timeline -------- */

  firstSeen: {
    type: Date,
    default: Date.now,
  },

  lastSeen: {
    type: Date,
    default: Date.now,
  },

  lastIncidentAt: {
    type: Date,
  },

  /* -------- Risk Decay -------- */

lastRiskUpdateAt: {
  type: Date,
  default: Date.now,
},

decayRate: {
  type: Number,
  default: 5,
},

mitre: [
  {
    techniqueId: String,
    technique: String,
    tactic: String,
    detectedAt: Date
  }
],


  /* -------- Metadata -------- */

  /**
   * Supporting data:
   * ip, userAgent, geo, headers, etc.
   */
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

/* -------- Indexes (Performance + SOC-grade) -------- */
riskProfileSchema.index({ entityType: 1, entityId: 1 }, { unique: true });
riskProfileSchema.index({ riskLevel: 1 });
riskProfileSchema.index({ status: 1 });

module.exports = mongoose.model("RiskProfile", riskProfileSchema);
