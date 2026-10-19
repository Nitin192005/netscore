import mongoose, { Schema } from "mongoose";

const speedTestAggregateSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  location: {
    latBucket: { type: Number, required: true },
    lonBucket: { type: Number, required: true },
  },
  timeBucket: {
    date: { type: String, required: true },
    hour: { type: Number, required: true },
  },
  metrics: {
    totalTests: { type: Number, default: 0 },
    sumDownload: { type: Number, default: 0 },
    sumUpload: { type: Number, default: 0 },
    maxDownload: Number,
    minDownload: Number,
    maxUpload: Number,
    minUpload: Number,
  },
  lastUpdated: { type: Date, default: Date.now },
});

speedTestAggregateSchema.index(
  {
    provider: 1,
    "location.latBucket": 1,
    "location.lonBucket": 1,
    "timeBucket.date": 1,
    "timeBucket.hour": 1,
  },
  { unique: true },
);

export const SpeedTestAggregate = mongoose.model(
  "SpeedTestAggregate",
  speedTestAggregateSchema,
);
