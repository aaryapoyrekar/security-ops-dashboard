import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from "react-leaflet";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

const API = "http://localhost:5000";
const getToken = () => localStorage.getItem("accessToken");
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

// ===== STYLES =====
const colors = {
  bg: "#0d1117",
  card: "#161b22",
  border: "#30363d",
  text: "#e6edf3",
  muted: "#8b949e",
  purple: "#a855f7",
  blue: "#58a6ff",
  green: "#3fb950",
  yellow: "#d29922",
  red: "#f85149",
  orange: "#e3b341",
};

// ===== COMPONENTS =====

function KpiCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: "20px 24px",
      flex: 1,
      minWidth: 160,
    }}>
      <div style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>
        {icon} {label}
      </div>
      <div style={{ color: color || colors.text, fontSize: 32, fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const colorMap = {
    Low: colors.green,
    Medium: colors.yellow,
    High: colors.red,
    Critical: "#ff0000",
  };
  return (
    <span style={{
      background: colorMap[level] + "22",
      color: colorMap[level] || colors.muted,
      border: `1px solid ${colorMap[level] || colors.border}`,
      borderRadius: 6,
      padding: "2px 10px",
      fontSize: 12,
      fontWeight: 600,
    }}>
      {level}
    </span>
  );
}

function BotEngineCard({ profile }) {
  if (!profile) return (
    <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ color: colors.muted }}>🤖 No bot activity detected</div>
    </div>
  );

  const score = profile.riskScore || 0;
  const barColor = score >= 50 ? colors.red : score >= 25 ? colors.yellow : colors.green;
  const isLocked = profile.status === "locked";

  return (
    <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 20 }}>
        🤖 Bot Intelligence Engine
      </div>
      <div style={{ display: "flex", gap: 40, marginBottom: 20 }}>
        <div>
          <div style={{ color: colors.muted, fontSize: 12 }}>Status</div>
          <div style={{ color: isLocked ? colors.red : colors.green, fontWeight: 700 }}>
            {isLocked ? "LOCKED (BOT DETECTED)" : "Active"}
          </div>
        </div>
        <div>
          <div style={{ color: colors.muted, fontSize: 12 }}>Risk Level</div>
          <div style={{ color: barColor, fontWeight: 700 }}>{profile.riskLevel}</div>
        </div>
        <div>
          <div style={{ color: colors.muted, fontSize: 12 }}>Bot Indicators</div>
          <div style={{ color: colors.purple, fontWeight: 700 }}>{profile.botIndicators}</div>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>Risk Score</div>
        <div style={{ background: "#ffffff11", borderRadius: 8, height: 20, overflow: "hidden" }}>
          <div style={{
            width: `${Math.min(score, 100)}%`,
            height: "100%",
            background: barColor,
            borderRadius: 8,
            transition: "width 0.5s ease",
          }} />
        </div>
        <div style={{ color: colors.muted, fontSize: 12, textAlign: "right", marginTop: 4 }}>
          {score} / 100
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>Triggered Behavioral Signals</div>
        {profile.signals?.map((s, i) => (
          <div key={i} style={{
            background: "#ffffff08",
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            padding: "8px 12px",
            marginBottom: 6,
            color: colors.text,
            fontSize: 13,
          }}>
            ⚠️ {s}
          </div>
        ))}
      </div>
      {isLocked && profile.lockUntil && (
        <div style={{
          background: colors.red + "22",
          border: `1px solid ${colors.red}`,
          borderRadius: 8,
          padding: 12,
          color: colors.red,
          fontSize: 13,
        }}>
          User locked until: <strong>{new Date(profile.lockUntil).toLocaleString()}</strong>
        </div>
      )}
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        {[
          { label: "Failed Attempts", value: profile.failedLogins, color: colors.red, bg: "#f8514922" },
          { label: "Successful Logins", value: profile.successfulLogins, color: colors.green, bg: "#3fb95022" },
          { label: "Total Attempts", value: (profile.failedLogins || 0) + (profile.successfulLogins || 0), color: colors.purple, bg: "#a855f722" },
        ].map((item, i) => (
          <div key={i} style={{
            flex: 1,
            background: item.bg,
            border: `1px solid ${item.color}44`,
            borderRadius: 8,
            padding: "12px 16px",
            textAlign: "center",
          }}>
            <div style={{ color: colors.muted, fontSize: 12 }}>{item.label}</div>
            <div style={{ color: item.color, fontSize: 24, fontWeight: 700 }}>{item.value || 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TravelMap({ events }) {
  if (!events || events.length < 2) return (
    <div style={{ color: colors.muted, padding: 20 }}>Not enough location data</div>
  );

  const positions = events.map(e => [e.latitude, e.longitude]);
  const center = [20, 0];

  return (
    <MapContainer center={center} zoom={2} style={{ height: 400, borderRadius: 8 }}
      attributionControl={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      {positions.map((pos, i) => (
        <CircleMarker key={i} center={pos} radius={8}
          pathOptions={{ color: i === positions.length - 1 ? "#00ff88" : "#ff8800", fillOpacity: 0.8 }}>
          <Popup>{events[i].city || `${pos[0].toFixed(2)}, ${pos[1].toFixed(2)}`}</Popup>
        </CircleMarker>
      ))}
      <Polyline positions={positions} pathOptions={{ color: "#ffff00", weight: 2 }} />
    </MapContainer>
  );
}

// ===== MAIN DASHBOARD =====

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [liveLogs, setLiveLogs] = useState([]);

  useEffect(() => {
    fetchAll();
    socket.on("new-alert", (alert) => {
      setLiveLogs(prev => [{
        _id: Date.now(),
        message: `${alert.attackType} detected`,
        level: alert.severity || "High",
        source: "Live",
        timestamp: new Date().toISOString(),
      }, ...prev].slice(0, 5));
    });
    return () => socket.off("new-alert");
  }, []);

  async function fetchAll() {
    try {
      const [s, t, p, l] = await Promise.all([
        fetch(`${API}/api/admin/stats`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/api/admin/login-trend`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/api/admin/risk-profiles`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/api/logs`, { headers: authHeaders() }).then(r => r.json()),
      ]);
      if (s.stats) setStats(s.stats);
      if (t.trend) setTrend(t.trend);
      if (p.profiles) setProfiles(p.profiles);
      if (Array.isArray(l)) setLogs(l.reverse());
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  async function fetchUserMap(userId) {
    try {
      const res = await fetch(`${API}/api/user/${encodeURIComponent(userId)}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.events) setUserEvents(data.events);
      setSelectedUser(userId);
    } catch (err) {
      console.error(err);
    }
  }

  const impossibleProfiles = profiles.filter(p => p.signals?.includes("Impossible travel detected"));
  const botProfile = profiles.filter(p => p.botIndicators > 0).sort((a, b) => b.botIndicators - a.botIndicators)[0];

  const riskDist = [
    { name: "Low", count: profiles.filter(p => p.riskLevel === "Low").length, color: colors.green },
    { name: "Medium", count: profiles.filter(p => p.riskLevel === "Medium").length, color: colors.yellow },
    { name: "High", count: profiles.filter(p => p.riskLevel === "High").length, color: colors.red },
  ];

  const tabs = ["overview", "riskProfiles", "travelAlerts", "logs"];
  const tabLabels = { overview: "Overview", riskProfiles: "Risk Profiles", travelAlerts: "Travel Alerts", logs: "Logs" };

  return (
    <div style={{ background: colors.bg, minHeight: "100vh", color: colors.text, fontFamily: "system-ui, sans-serif" }}>

      {/* HEADER */}
      <div style={{ textAlign: "center", padding: "32px 0 16px" }}>
        <div style={{ fontSize: 28, fontWeight: 800, background: "linear-gradient(90deg, #a855f7, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          🛡 SECURITY OPERATIONS DASHBOARD
        </div>

        {/* TABS */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? colors.purple : colors.card,
              color: colors.text,
              border: `1px solid ${tab === t ? colors.purple : colors.border}`,
              borderRadius: 20,
              padding: "8px 20px",
              cursor: "pointer",
              fontWeight: tab === t ? 700 : 400,
              fontSize: 14,
            }}>
              {tabLabels[t]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 32px 32px" }}>

        {/* ===== OVERVIEW TAB ===== */}
        {tab === "overview" && (
          <>
            {/* SOC KPIs */}
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 SOC Health Overview (Today)</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              <KpiCard icon="🚨" label="Total Alerts Today" value={stats?.totalAlertsToday ?? "—"} color={colors.red} />
              <KpiCard icon="🔴" label="High Severity Alerts" value={stats?.highSeverityAlerts ?? "—"} color={colors.red} />
              <KpiCard icon="🔒" label="Locked Accounts" value={stats?.lockedAccounts ?? "—"} color={colors.orange} />
              <KpiCard icon="🤖" label="Bot Detections" value={stats?.botDetections ?? "—"} color={colors.purple} />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
              <KpiCard icon="❌" label="Failed Logins (24h)" value={stats?.failedLogins ?? "—"} color={colors.red} />
              <KpiCard icon="📈" label="Avg Risk Score" value={stats?.avgRiskScore ?? "—"} color={colors.blue} />
              <KpiCard icon="⏰" label="Peak Attack Hour" value={stats?.peakHour ?? "—"} color={colors.orange} />
              <KpiCard icon="🎯" label="Most Targeted User" value={stats?.mostTargetedUser?.id ? `${stats.mostTargetedUser.id.substring(0, 20)}... (${stats.mostTargetedUser.count})` : "—"} color={colors.red} />
            </div>

            {/* FAILED LOGIN TREND */}
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📉 Failed Login Trend (Today)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trend}>
                  <XAxis dataKey="hour" tick={{ fill: colors.muted, fontSize: 11 }} />
                  <YAxis tick={{ fill: colors.muted, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.text }} />
                  <Bar dataKey="count" name="Failed Logins" fill={colors.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* USER RISK SUMMARY + DISTRIBUTION */}
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>👥 User Risk Summary</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              <KpiCard icon="👤" label="Total Users" value={profiles.length} />
              <KpiCard icon="🚨" label="High Risk Users" value={profiles.filter(p => p.riskLevel === "High" || p.riskLevel === "Medium").length} color={colors.red} />
              <KpiCard icon="🌍" label="Impossible Travel" value={impossibleProfiles.length} color={colors.blue} />
              <KpiCard icon="🤖" label="Bot Indicators" value={profiles.filter(p => p.botIndicators > 0).length} color={colors.purple} />
              <KpiCard icon="🔒" label="Blocked Users" value={profiles.filter(p => p.status === "locked").length} color={colors.orange} />
            </div>

            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📊 Risk Distribution Overview</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={riskDist}>
                  <XAxis dataKey="name" tick={{ fill: colors.muted }} />
                  <YAxis tick={{ fill: colors.muted }} />
                  <Tooltip contentStyle={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.text }} />
                  <Bar dataKey="count" name="Users by Risk Level" radius={[4, 4, 0, 0]}>
                    {riskDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* BOT INTELLIGENCE */}
            <BotEngineCard profile={botProfile} />
          </>
        )}

        {/* ===== RISK PROFILES TAB ===== */}
        {tab === "riskProfiles" && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>👤 Risk Profiles</div>
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#ffffff08" }}>
                    {["User ID", "Risk Score", "Risk Level", "Status", "Signals", "MITRE", "Last Updated"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: colors.muted, fontSize: 13, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p._id} style={{ borderTop: `1px solid ${colors.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = "#ffffff05"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ color: colors.blue, cursor: "pointer", fontFamily: "monospace", fontSize: 13 }}
                          onClick={() => { fetchUserMap(p.entityId); setTab("travelAlerts"); }}>
                          {p.entityId}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: colors.text }}>{p.riskScore}</td>
                      <td style={{ padding: "12px 16px" }}><RiskBadge level={p.riskLevel} /></td>
                      <td style={{ padding: "12px 16px", color: p.status === "locked" ? colors.red : colors.green, textTransform: "capitalize" }}>{p.status}</td>
                      <td style={{ padding: "12px 16px", color: colors.muted, fontSize: 13 }}>{p.signals?.join(", ") || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {p.mitre && [...new Map(p.mitre.map(m => [m.techniqueId, m])).values()].map((m, i) => (
                            <span key={i} title={`${m.technique} — ${m.tactic}`}
                              style={{ color: colors.blue, fontSize: 12, cursor: "help", fontWeight: 600 }}>
                              {m.techniqueId}
                            </span>
                          ))}
                          {(!p.mitre || p.mitre.length === 0) && <span style={{ color: colors.muted }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: colors.muted, fontSize: 12 }}>
                        {p.lastSeen ? new Date(p.lastSeen).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== TRAVEL ALERTS TAB ===== */}
        {tab === "travelAlerts" && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🌍 Impossible Travel Detections</div>

            {selectedUser && (
              <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                  📍 User Security Analysis — {selectedUser}
                </div>
                <TravelMap events={userEvents} />
              </div>
            )}

            {impossibleProfiles.length === 0 ? (
              <div style={{ color: colors.muted, padding: 20 }}>No impossible travel detections</div>
            ) : (
              impossibleProfiles.map(p => (
                <div key={p._id} style={{
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                  onClick={() => fetchUserMap(p.entityId)}>
                  <div>
                    <div style={{ color: colors.blue, fontWeight: 600, marginBottom: 4 }}>{p.entityId}</div>
                    <div style={{ color: colors.muted, fontSize: 13 }}>Impossible travel detected (geo-velocity anomaly) — Click to view map</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <RiskBadge level={p.riskLevel} />
                    <span style={{ color: p.status === "locked" ? colors.red : colors.green, fontSize: 13 }}>{p.status}</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ===== LOGS TAB ===== */}
        {tab === "logs" && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 System Logs</div>
            {liveLogs.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: colors.green, fontSize: 13, marginBottom: 8 }}>🟢 Live Events</div>
                {liveLogs.map(l => (
                  <div key={l._id} style={{
                    background: colors.green + "11",
                    border: `1px solid ${colors.green}44`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 6,
                    fontSize: 13,
                  }}>
                    {l.message} — {new Date(l.timestamp).toLocaleTimeString()}
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#ffffff08" }}>
                    {["Message", "Level", "Source", "Timestamp"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: colors.muted, fontSize: 13 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id} style={{ borderTop: `1px solid ${colors.border}` }}>
                      <td style={{ padding: "12px 16px", color: colors.text }}>{log.message}</td>
                      <td style={{ padding: "12px 16px", color: log.level === "High" ? colors.red : colors.muted }}>{log.level}</td>
                      <td style={{ padding: "12px 16px", color: colors.muted }}>{log.source}</td>
                      <td style={{ padding: "12px 16px", color: colors.muted, fontSize: 12 }}>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* LOGOUT */}
        <div style={{ textAlign: "right", marginTop: 32 }}>
          <button onClick={() => { localStorage.clear(); window.location.href = "/login"; }} style={{
            background: colors.red + "22",
            color: colors.red,
            border: `1px solid ${colors.red}44`,
            borderRadius: 8,
            padding: "8px 20px",
            cursor: "pointer",
            fontSize: 14,
          }}>
            🚪 Logout
          </button>
        </div>

      </div>
    </div>
  );
}