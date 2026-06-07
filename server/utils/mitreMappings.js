// server/utils/mitreMappings.js

const mitreMappings = {
  multi_ip_login: {
    techniqueId: "T1078",
    technique: "Valid Accounts",
    tactic: "Initial Access",
  },
  impossible_travel: {
    techniqueId: "T1078.001",
    technique: "Valid Accounts: Default Accounts",
    tactic: "Initial Access",
  },
  blacklisted_ip_attempt: {
    techniqueId: "T1090",
    technique: "Proxy",
    tactic: "Defense Evasion",
  },
  non_whitelisted_ip_attempt: {
    techniqueId: "T1090",
    technique: "Proxy",
    tactic: "Defense Evasion",
  },
  "Failed Login": {
    techniqueId: "T1110",
    technique: "Brute Force",
    tactic: "Credential Access",
  },
  "Brute Force Attack": {
    techniqueId: "T1110.001",
    technique: "Brute Force: Password Guessing",
    tactic: "Credential Access",
  },
  automated_login_attempt: {
    techniqueId: "T1078.003",
    technique: "Valid Accounts: Local Accounts",
    tactic: "Initial Access",
  },
  "SQL Injection": {
    techniqueId: "T1190",
    technique: "Exploit Public-Facing Application",
    tactic: "Initial Access",
  },
  XSS: {
    techniqueId: "T1059.007",
    technique: "Command and Scripting Interpreter: JavaScript",
    tactic: "Execution",
  },
  "Directory Traversal": {
    techniqueId: "T1083",
    technique: "File and Directory Discovery",
    tactic: "Discovery",
  },
};

function getMitreMapping(attackType) {
  return mitreMappings[attackType] || null;
}

module.exports = { getMitreMapping };