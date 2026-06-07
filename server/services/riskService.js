const MITRE = require("../constants/mitreMap");

/**
 * =====================================================
 * Helper: Safely add a MITRE ATT&CK technique
 * - Ensures `profile.mitre` is an array
 * - Prevents duplicate technique IDs
 * =====================================================
 */
function addMitreTechnique(profile, mitreData) {
  if (!Array.isArray(profile.mitre)) {
    profile.mitre = [];
  }

  const exists = profile.mitre.some(
    (m) => m.techniqueId === mitreData.techniqueId
  );

  if (!exists) {
    profile.mitre.push({
      techniqueId: mitreData.techniqueId,
      technique: mitreData.technique,
      tactic: mitreData.tactic,
      detectedAt: new Date()
    });
  }
}

/**
 * =====================================================
 * Impossible Travel (Geo-Velocity Anomaly)
 * MITRE ATT&CK:
 *   - T1078 → Valid Accounts
 *   - Tactic: Initial Access
 * =====================================================
 */
function applyImpossibleTravelRisk(profile, geoResult) {
  // 1️⃣ Risk Score & Level
  profile.riskScore += 25;

  if (profile.riskScore >= 75) {
    profile.riskLevel = "Critical";
  } else if (profile.riskScore >= 40) {
    profile.riskLevel = "High";
  } else {
    profile.riskLevel = "Medium";
  }

  profile.confidence = "High";

  // 2️⃣ Signal (idempotent)
  if (!profile.signals.includes("Impossible travel detected")) {
    profile.signals.push("Impossible travel detected");
  }

  // 3️⃣ MITRE Mapping
  addMitreTechnique(profile, MITRE.IMPOSSIBLE_TRAVEL);

  // 4️⃣ Timestamps
  profile.lastIncidentAt = new Date();
  profile.lastRiskUpdateAt = new Date();
}

/**
 * =====================================================
 * Brute Force / Credential Stuffing
 * MITRE ATT&CK:
 *   - T1110 → Brute Force
 *   - Tactic: Credential Access
 * =====================================================
 */
function applyBruteForceRisk(profile) {
  // 1️⃣ Risk Score & Level
  profile.riskScore += 15;

  if (profile.riskScore >= 75) {
    profile.riskLevel = "Critical";
  } else if (profile.riskScore >= 40) {
    profile.riskLevel = "High";
  } else {
    profile.riskLevel = "Medium";
  }

  profile.confidence = "Medium";

  // 2️⃣ Signal (idempotent)
  if (!profile.signals.includes("Multiple failed login attempts")) {
    profile.signals.push("Multiple failed login attempts");
  }

  // 3️⃣ MITRE Mapping
  addMitreTechnique(profile, MITRE.BRUTE_FORCE);

  // 4️⃣ Timestamp
  profile.lastRiskUpdateAt = new Date();
}

module.exports = {
  applyImpossibleTravelRisk,
  applyBruteForceRisk
};
