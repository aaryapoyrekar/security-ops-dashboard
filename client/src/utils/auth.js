// utils/auth.js

export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
};

export const getAccessToken = () => {
  const token = localStorage.getItem("accessToken");

  // 🔒 HARD BLOCK invalid values
  if (!token || token === "null" || token === "undefined") {
    return null;
  }

  return token;
};

export const getRefreshToken = () => {
  const token = localStorage.getItem("refreshToken");

  if (!token || token === "null" || token === "undefined") {
    return null;
  }

  return token;
};

export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};
