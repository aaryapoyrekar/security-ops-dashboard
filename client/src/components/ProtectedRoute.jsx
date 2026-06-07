import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { getAccessToken } from "../utils/auth";

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const verify = async () => {
      const token = getAccessToken();

      if (!token) {
        setStatus("unauthenticated");
        return;
      }

      try {
        await axios.post(
          "http://localhost:5000/api/admin/pre-auth",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setStatus("allowed");
      } catch {
        setStatus("unauthenticated");
      }
    };

    verify();
  }, []);

  if (status === "checking") {
    return <h3 style={{ padding: "2rem" }}>🔐 Verifying secure access…</h3>;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
