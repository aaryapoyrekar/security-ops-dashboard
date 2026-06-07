# 🛡️ Security Operations Dashboard

A full-stack **Security Monitoring & Threat Detection Dashboard** built using the **MERN stack**.

This project simulates real-world **SOC (Security Operations Center)** detection logic including adaptive threat detection and behavioral analysis.

---

## 🚀 Features

### 🔐 Authentication System
- Email + Password login
- 6-digit MFA verification (Google Authenticator)
- IP Whitelisting (Allowed IPs)
- IP Blacklisting
- Account Lock after suspicious behavior
- JWT Access Token + Refresh Token

---

### 🧠 Detection Logic Implemented

**1️⃣ Multi-IP Detection**
Detects when a single user logs in from multiple IP addresses within a short time window.

**2️⃣ Impossible Travel Detection**
Detects login attempts from geographically impossible distances in short time.
Uses:
- GeoIP lookup
- Velocity calculation
- Travel speed threshold logic (Haversine formula)

**3️⃣ Multiple Failed Login Detection**
Triggers alert when failed attempts exceed defined threshold within 60 seconds.

**4️⃣ Bot Detection Engine**
Risk scoring based on:
- Missing User-Agent header
- Missing device fingerprint
- Abnormal request behavior (unnaturally fast login attempts)

**5️⃣ MITRE ATT&CK Mapping**
Alerts tagged with MITRE Technique IDs for real-world threat modeling.
- T1078 — Valid Accounts
- T1110 — Brute Force
- T1078.003 — Local Accounts
- T1090 — Proxy

---

### 📊 Dashboard Capabilities
- SOC Health Overview (real-time KPIs)
- Failed Login Trend Chart
- User Risk Summary
- Risk Distribution Overview
- Alert Monitoring
- Travel Alerts with World Map
- Bot Intelligence Engine
- Behavioral Signal Tracking
- MITRE ATT&CK Mapping
- Audit Logging
- Socket.IO Live Updates

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Recharts
- Leaflet / React-Leaflet
- Socket.IO Client

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Security Logic
- GeoIP Service
- Velocity Engine
- Risk Scoring System (0–100)
- Risk Decay Engine
- MITRE ATT&CK Framework

---

## 📁 Project Structure

```
security-ops-dashboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Dashboard, Navbar
│   │   ├── pages/          # Login
│   │   └── utils/          # Auth helpers
├── server/                 # Node.js backend
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth, IP filter, audit logger
│   ├── utils/              # Detection engines
│   ├── jobs/               # Risk decay scheduler
│   └── simulate.js         # Attack simulator
└── Report.pdf              # Project report
```

---

## ⚙️ How To Run Locally

### Prerequisites
- Node.js v22+
- MongoDB v8+
- npm v11+

### 1. Clone the repo
```bash
git clone https://github.com/aaryapoyrekar/security-ops-dashboard.git
cd security-ops-dashboard
```

### 2. Install dependencies
```bash
cd server
npm install

cd ../client
npm install
```

### 3. Configure environment variables
Create a `.env` file inside the `server` folder:
```env
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
MONGO_URI=mongodb://127.0.0.1:27017/security_dashboard
PORT=5000
```

### 4. Start MongoDB
```bash
"C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe"
```

### 5. Create admin account
```bash
cd server
node scripts/createAdmin.js
```

### 6. Start backend
```bash
cd server
node index.js
```

### 7. Start frontend
```bash
cd client
npm start
```

### 8. Run attack simulation (optional)
```bash
cd server
node simulate.js
```

---

## 🔑 Default Credentials
```
Email: admin@company.com
Password: Admin@123
MFA: Set up via Google Authenticator
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/mfa/verify` | MFA verification |
| POST | `/api/admin/refresh-token` | Refresh access token |
| POST | `/api/admin/logout` | Logout |
| GET | `/api/admin/dashboard` | Dashboard data |
| POST | `/api/alerts` | Receive security events from external apps |
| GET | `/api/admin/risk-profiles` | All risk profiles |
| GET | `/api/admin/stats` | SOC statistics |
| GET | `/api/admin/login-trend` | Failed login trend |
| GET | `/api/logs` | System logs |
| GET | `/api/admin/audit-logs` | Audit logs |
| POST | `/api/admin/ip-list` | Add IP to whitelist/blacklist |
| GET | `/api/user/:userId` | User login map data |

---

## 📄 Report
See [Report.pdf](./Report.pdf) for the full project report.

---

## 🎯 Future Improvements
- Real-time WebSocket alerts *(partially implemented via Socket.IO)*
- ML-based anomaly detection
- SIEM integration
- Deployment on cloud
- Multi-tenant support for multiple client applications

---

## 👤 Author
**Aarya Poyrekar**
GitHub: [@aaryapoyrekar](https://github.com/aaryapoyrekar)