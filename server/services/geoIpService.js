/**
 * Resolve IP address to geographic location
 * Uses ipapi.co (free, no API key needed)
 * Node.js v18+ has native fetch
 */
async function getGeoFromIP(ip) {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();

    if (!data || data.error) {
      throw new Error("Invalid geo response");
    }

    return {
      ip,
      city: data.city || "Unknown",
      country: data.country_name || "Unknown",
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (err) {
    console.error("Geo-IP lookup failed:", err.message);

    return {
      ip,
      city: "Unknown",
      country: "Unknown",
      latitude: null,
      longitude: null,
    };
  }
}

module.exports = { getGeoFromIP };
