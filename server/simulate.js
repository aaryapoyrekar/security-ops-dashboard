// server/simulate.js
const axios = require("axios");

const BASE_URL = "http://localhost:5000";

const users = [
  "testuser@gmail.com",
  "victim@company.com",
  "bruteuser@test.com",
  "john.doe@example.com",
  "alice@startup.com"
];

// Locations for impossible travel simulation
const locations = [
  { latitude: 19.0760, longitude: 72.8777, ip: "103.21.58.1", city: "Mumbai" },
  { latitude: 51.5074, longitude: -0.1278, ip: "82.132.210.1", city: "London" },
  { latitude: 40.7128, longitude: -74.0060, ip: "72.229.28.185", city: "New York" },
  { latitude: -33.8688, longitude: 151.2093, ip: "1.128.0.1", city: "Sydney" },
  { latitude: 35.6762, longitude: 139.6503, ip: "126.0.0.1", city: "Tokyo" },
];

async function sendAlert(data) {
  try {
    await axios.post(`${BASE_URL}/api/alerts`, data);
    console.log("✅ Alert sent:", data.type, "for", data.value);
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message || err);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simulate() {
  console.log("🚀 Starting attack simulation...\n");

  // 1. Bot attacks
  console.log("🤖 Simulating bot attacks...");
  for (const user of users) {
    for (let i = 0; i < 5; i++) {
      await sendAlert({
        source: "Web App",
        type: "login_attempt",
        value: user,
        endpoint: "/login",
        severity: "High",
        extra: {
          success: false,
          failureReason: "invalid_password",
        },
      });
      await sleep(100);
    }
  }

  // 2. Multiple failed logins
  console.log("\n❌ Simulating multiple failed logins...");
  for (const user of users) {
    for (let i = 0; i < 6; i++) {
      await sendAlert({
        source: "Web App",
        type: "login_attempt",
        value: user,
        endpoint: "/login",
        severity: "Medium",
        extra: {
          success: false,
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          deviceHash: `device-${user}-001`,
          failureReason: "invalid_password",
        },
      });
      await sleep(200);
    }
  }

  // 3. Successful logins
  console.log("\n✅ Simulating successful logins...");
  for (const user of users) {
    await sendAlert({
      source: "Web App",
      type: "login_attempt",
      value: user,
      endpoint: "/login",
      severity: "Low",
      extra: {
        success: true,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        deviceHash: `device-${user}-001`,
      },
    });
    await sleep(200);
  }

  // 4. Impossible Travel Detection
  console.log("\n✈️ Simulating impossible travel...");
  for (const user of users) {
    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      await sendAlert({
        source: "Web App",
        type: "login_attempt",
        value: user,
        endpoint: "/login",
        severity: "High",
        extra: {
          success: true,
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          deviceHash: `device-${user}-001`,
          latitude: loc.latitude,
          longitude: loc.longitude,
          ip: loc.ip,
          city: loc.city,
        },
      });
      await sleep(300);
    }
  }

  // 5. SQL Injection
  console.log("\n💉 Simulating SQL injection...");
  await sendAlert({
    source: "Web App",
    type: "login_attempt",
    value: "hacker@evil.com",
    endpoint: "/search",
    severity: "High",
    extra: {
      userAgent: "Mozilla/5.0",
      message: "union select drop table",
    },
  });

  // 6. XSS
  console.log("\n🔴 Simulating XSS...");
  await sendAlert({
    source: "Web App",
    type: "login_attempt",
    value: "xss@evil.com",
    endpoint: "/search",
    severity: "High",
    extra: {
      userAgent: "Mozilla/5.0",
      message: "<script>document.cookie</script>",
    },
  });

  console.log("\n🎉 Simulation complete! Check your dashboard.");
}

simulate();