import { SpeedTest } from '../models/measure.model.js';
import { ApiError } from '../utils/ApiError.js';
import { resolveIsp, looksLikeIp } from '../services/isp.service.js';
import { upsertSpeedTestAggregate } from '../services/aggregate.service.js';

const sendData = async (req, res) => {
  const { downloadSpeed, uploadSpeed, ping, ip, latitude, longitude, provider } = req.body;

  if (downloadSpeed == null || uploadSpeed == null || ping == null) {
    throw new ApiError(400, "Missing required fields");
  }

  const resolvedIp = ip || "Unknown";
  let resolvedProvider = provider;
  let resolvedIsp = null;

  if (!resolvedProvider || resolvedProvider === resolvedIp || looksLikeIp(resolvedProvider)) {
    const ispResult = await resolveIsp(resolvedIp);
    resolvedProvider = ispResult.provider;
    resolvedIsp = ispResult.isp;
  }

  const entry = new SpeedTest({
    ip: resolvedIp,
    isp: resolvedIsp,
    provider: resolvedProvider || "Unknown",
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    downloadSpeedMbps: downloadSpeed,
    uploadSpeedMbps: uploadSpeed,
    pingMs: ping,
  });

  await entry.save();
  await upsertSpeedTestAggregate(entry);

  res.json({ success: true, data: entry });
};

const getData = async (req, res) => {
  const latestEntry = await SpeedTest.findOne().sort({ timestamp: -1 });

  if (!latestEntry) {
    throw new ApiError(404, "No speed test data found");
  }

  res.json({ success: true, data: latestEntry });
};

export { sendData, getData };
