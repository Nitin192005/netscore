import { lookupIp, looksLikeIp } from "../services/isp.service.js";

export const getIpGeo = async (req, res) => {
  const ip = (req.query.ip || "").trim();

  if (!ip || !looksLikeIp(ip)) {
    return res.status(400).json({
      success: false,
      message: "ip query param is required",
    });
  }

  const result = await lookupIp(ip);

  return res.json({
    success: true,
    data: {
      latitude: result.latitude,
      longitude: result.longitude,
      location: result.location,
      provider: result.provider,
    },
  });
};
