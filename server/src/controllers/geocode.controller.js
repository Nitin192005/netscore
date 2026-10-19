// Reverse geocode via Nominatim; fall back to lat/lon if unreachable
export const reverseGeocode = async (req, res) => {
  const lat = Number.parseFloat(req.query.lat);
  const lon = Number.parseFloat(req.query.lon);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({
      success: false,
      message: "lat and lon query params are required",
    });
  }

  const fallback = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "NetworkAnalyzer/1.0 (local-dev)",
          Accept: "application/json",
        },
      },
    );
    clearTimeout(timer);

    if (!response.ok) {
      return res.json({ success: true, data: { location: fallback } });
    }

    const data = await response.json();
    return res.json({
      success: true,
      data: { location: data?.display_name || fallback },
    });
  } catch {
    // DNS / timeout / network — coords are enough for the UI
    return res.json({ success: true, data: { location: fallback } });
  }
};
