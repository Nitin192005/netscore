import mongoose, { Schema } from "mongoose";

const speedTestSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  isp: String,
  provider: String,
  latitude: Number,
  longitude: Number,
  downloadSpeedMbps: Number,
  uploadSpeedMbps: Number,
  pingMs: Number,
  timestamp: { type: Date, default: Date.now }
});

export const SpeedTest = mongoose.model('SpeedTest', speedTestSchema);
