// client/src/pages/Logs.js
import React, { useEffect, useState } from "react";
import axios from "axios";

function Logs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get("/api/logs");
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>📊 Security Logs</h1>
      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: "20px" }}>
        <thead>
          <tr>
            <th>Message</th>
            <th>Level</th>
            <th>Source</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id}>
              <td>{log.message}</td>
              <td>{log.level}</td>
              <td>{log.source}</td>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Logs;
