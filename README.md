# 🛡️ Security Operations Dashboard

A full-stack **Security Monitoring & Threat Detection Dashboard** built using the **MERN stack**.

This project simulates a real-world **SOC (Security Operations Center)** with adaptive threat detection and behavioral analysis.

---

## 📸 Screenshots

### Overview
![Overview](screenshots/overview.png)

### Risk Profiles
![Risk Profiles](screenshots/risk-profiles.png)

### Travel Alerts
![Travel Alerts](screenshots/travel-alerts.png)

### Bot Intelligence Engine
![Bot Engine](screenshots/bot-engine.png)

---

## 🚀 Features

### 🔐 Authentication System
- Email + Password login
- 6-digit MFA verification (Google Authenticator)
- IP Whitelisting & Blacklisting
- Account lock after suspicious behavior
- JWT Access Token + Refresh Token

### 🧠 Detection Logic

| Detection | Description |
|-----------|-------------|
| **Multi-IP Detection** | Detects logins from multiple IPs within 10 minutes |
| **Impossible Travel** | Detects geographically impossible login locations using Haversine formula |
| **Bot Detection** | Risk scoring based on missing User-Agent, device fingerprint, rapid requests |
| **Brute Force** | Triggers after 5+ failed attempts within 60 seconds |
| **SQL Injection** | Pattern-based detection on incoming requests |
| **XSS Detection** | Detects cross-site scripting attempts |

### 📊 Dashboard Capabilities
- SOC Health Overview (real-time KPIs)
- Failed Login Trend chart
- User Risk Summary
- Risk Distribution Overview
- Alert Monitoring
- Travel Alerts with World Map
- Bot Intelligence Engine
- Behavioral Signal Tracking
- MITRE ATT&CK Mapping
- Audit Logging
- Socket.IO live updates

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Recharts (charts)
- Leaflet / React-Leaflet (world map)
- Socket.IO Client

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.IO
- JWT Authentication
- Speakeasy (MFA/TOTP)

### Security Logic
- GeoIP Velocity Engine
- Risk Scoring System (0-100)
- Risk Decay Job (auto-reduces risk over time)
- MITRE ATT&CK Framework mapping
- Behavioral Analysis Engine

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v22+
- MongoDB v8+
- npm v11+

### 1. Clone the repository
```bash
git clone https://github.com/aaryapoyrekar/security-ops-dashboard.git
cd security-ops-dashboard
```

### 2. Install server dependencies
```bash
cd server
npm install
```

### 3. Install client dependencies
```bash
cd ../client
npm install
```

### 4. Configure environment variables
Create a `.env` file in the `server` folder:
```env
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
MONGO_URI=mongodb://127.0.0.1:27017/security_dashboard
PORT=5000
```

### 5. Start MongoDB
```bash
"C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe"
```

### 6. Create admin account
```bash
cd server
node scripts/createAdmin.js
```

### 7. Start the server
```bash
cd server
node index.js
```

### 8. Start the client
```bash
cd client
npm start
```

### 9. Run attack simulation (optional)
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
│   ├── middleware/         # Auth, IP filter, audit
│   ├── utils/              # Detection engines
│   ├── jobs/               # Risk decay scheduler
│   └── simulate.js         # Attack simulator
└── Report.pdf              # Project report
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
| POST | `/api/alerts` | Receive security events |
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

## 👤 Author
**Aarya Poyrekar**
GitHub: [@aaryapoyrekar](https://github.com/aaryapoyrekar)

